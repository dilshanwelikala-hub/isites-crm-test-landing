import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import type { Payload } from 'payload'

import { analyticsHref, analyticsRange, summarizeAnalytics } from '../src/lib/analytics'
import {
  analyticsVisitor,
  createTrackingToken,
  excludedTrackingRequest,
  referrerHostname,
  verifyTrackingToken,
} from '../src/lib/analyticsServer'
import { collectAnalytics } from '../src/lib/collectAnalytics'

test('tracking tokens are signed, expiring and bind a page to its site', () => {
  const token = createTrackingToken(12, '/sites/resort', 1000)
  assert.equal(verifyTrackingToken(token, 1001)?.site, 12)
  assert.equal(verifyTrackingToken(token, 1001)?.path, '/sites/resort')
  assert.equal(verifyTrackingToken(token, 86401000), null)
  const [body, signature] = token.split('.')
  const forged = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), site: 13 }),
  ).toString('base64url')
  assert.equal(verifyTrackingToken(`${forged}.${signature}`, 1001), null)
  for (const value of [undefined, '', 'bad', `${token}.extra`, 'x'.repeat(3000)])
    assert.equal(verifyTrackingToken(value), null)
})

test('visitor identifiers are pseudonymous and isolated between sites', () => {
  const visitor = randomUUID()
  assert.equal(analyticsVisitor(visitor, 12), analyticsVisitor(visitor, 12))
  assert.notEqual(analyticsVisitor(visitor, 12), analyticsVisitor(visitor, 13))
  assert.notEqual(analyticsVisitor(visitor, null), visitor)
})

test('privacy opt-outs and obvious bots are excluded', () => {
  const cases: Record<string, string>[] = [
    { dnt: '1' },
    { 'sec-gpc': '1' },
    { 'user-agent': 'Googlebot' },
    { 'user-agent': 'HeadlessChrome' },
  ]
  for (const headers of cases) {
    assert.equal(excludedTrackingRequest(new Headers(headers)), true)
  }
  assert.equal(
    excludedTrackingRequest(new Headers({ 'user-agent': 'Mozilla/5.0 Chrome/130' })),
    false,
  )
})

test('referrers retain only external hostnames and never query values or paths', () => {
  assert.equal(
    referrerHostname(
      'https://search.test/private?email=secret@example.com#token',
      'https://site.test',
    ),
    'search.test',
  )
  assert.equal(
    referrerHostname('https://site.test/packages/test?private=true', 'https://site.test'),
    undefined,
  )
  assert.equal(referrerHostname('javascript:alert(1)', 'https://site.test'), undefined)
})

test('date filters use inclusive UTC days, default to 30 and cap at 90', () => {
  const now = new Date('2026-10-19T18:00:00Z')
  assert.deepEqual(analyticsRange(undefined, undefined, now), {
    start: '2026-09-20',
    end: '2026-10-19',
    from: '2026-09-20T00:00:00.000Z',
    until: '2026-10-20T00:00:00.000Z',
  })
  assert.equal(analyticsRange('2020-01-01', '2026-10-19', now).start, '2026-07-22')
  assert.equal(analyticsRange('2026-02-30', 'invalid', now).start, '2026-09-20')
  assert.equal(analyticsRange('2026-12-01', '2026-12-31', now).end, '2026-10-19')
  assert.match(analyticsHref('a&site=b'), /site=a%26site%3Db$/)
})

test('reports deduplicate visitor conversion and fill missing days', () => {
  const range = analyticsRange('2026-10-17', '2026-10-19', new Date('2026-10-19'))
  const summary = summarizeAnalytics(
    [
      {
        createdAt: '2026-10-17T01:00:00Z',
        path: '/',
        eventType: 'page_view',
        visitor: 'A',
        referrer: 'search.test',
      },
      {
        createdAt: '2026-10-17T02:00:00Z',
        path: '/packages/one',
        eventType: 'page_view',
        visitor: 'A',
      },
      { createdAt: '2026-10-19T01:00:00Z', path: '/', eventType: 'page_view', visitor: 'B' },
      {
        createdAt: '2026-10-19T02:00:00Z',
        path: '/',
        eventType: 'click',
        action: 'hero_cta',
        visitor: 'B',
      },
      { createdAt: '2026-10-16T02:00:00Z', path: '/', eventType: 'page_view', visitor: 'C' },
    ],
    [
      { createdAt: '2026-10-19T03:00:00Z', analyticsVisitor: 'A' },
      { createdAt: '2026-10-19T04:00:00Z', analyticsVisitor: 'A' },
      { createdAt: '2026-10-19T05:00:00Z', analyticsVisitor: 'unobserved' },
    ],
    range,
  )
  assert.equal(summary.views, 3)
  assert.equal(summary.visitors, 2)
  assert.equal(summary.inquiries, 3)
  assert.equal(summary.clicks, 1)
  assert.equal(summary.conversion, 50)
  assert.deepEqual(summary.days[1], { date: '2026-10-18', views: 0, inquiries: 0 })
  assert.equal(summary.pages[0].count, 2)
})

function collector() {
  const rows: Record<string, any>[] = []
  let enabled = true
  const payload = {
    findGlobal: async () => ({ analyticsEnabled: enabled }),
    findByID: async () => ({ analyticsEnabled: enabled, _status: 'published', siteStatus: 'live' }),
    count: async ({ where }: any) => ({
      totalDocs: rows.filter((row) =>
        Object.entries(where).every(([field, filter]) => row[field] === (filter as any).equals),
      ).length,
    }),
    create: async ({ data }: any) => {
      rows.push(data)
      return data
    },
  } as unknown as Payload
  const request = (data: unknown, headers: Record<string, string> = {}) =>
    new Request('https://site.test/api/analytics', {
      method: 'POST',
      headers: { origin: 'https://site.test', 'content-type': 'application/json', ...headers },
      body: JSON.stringify(data),
    })
  return {
    rows,
    payload,
    request,
    disable: () => {
      enabled = false
    },
  }
}

test('collector deduplicates views and retries, isolates site/path and drops extra data', async () => {
  const { rows, payload, request } = collector()
  const data = {
    token: createTrackingToken(12, '/sites/one'),
    visitor: randomUUID(),
    eventType: 'page_view',
    site: 99,
    path: '/admin',
    email: 'secret@example.com',
    referrer: 'https://search.test/?private=1',
  }
  assert.equal((await collectAnalytics(request(data), payload)).status, 204)
  assert.equal((await collectAnalytics(request(data), payload)).status, 204)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].site, 12)
  assert.equal(rows[0].path, '/sites/one')
  assert.equal(rows[0].referrer, 'search.test')
  assert.equal(rows[0].email, undefined)
  const click = { ...data, eventType: 'click', eventID: randomUUID(), action: 'hero_cta' }
  await collectAnalytics(request(click), payload)
  await collectAnalytics(request(click), payload)
  assert.equal(rows.length, 2)
})

test('collector rejects cross-origin, invalid, oversized and disabled requests', async () => {
  const { rows, payload, request, disable } = collector()
  const data = {
    token: createTrackingToken(null, '/'),
    visitor: randomUUID(),
    eventType: 'page_view',
  }
  assert.equal(
    (await collectAnalytics(request(data, { origin: 'https://evil.test' }), payload)).status,
    403,
  )
  assert.equal((await collectAnalytics(request({ ...data, visitor: 'bad' }), payload)).status, 400)
  assert.equal(
    (await collectAnalytics(request({ ...data, eventType: 'conversion' }), payload)).status,
    400,
  )
  assert.equal(
    (
      await collectAnalytics(
        request({ ...data, eventType: 'click', eventID: randomUUID(), action: '__proto__' }),
        payload,
      )
    ).status,
    400,
  )
  assert.equal(
    (await collectAnalytics(request({ ...data, extra: 'a'.repeat(5000) }), payload)).status,
    413,
  )
  assert.equal((await collectAnalytics(request(data, { dnt: '1' }), payload)).status, 204)
  assert.equal(
    (await collectAnalytics(request(data, { 'content-type': 'text/plain' }), payload)).status,
    415,
  )
  disable()
  assert.equal((await collectAnalytics(request(data), payload)).status, 204)
  assert.equal(rows.length, 0)
})

test('collector bounds the number of events accepted for a signed page', async () => {
  const { payload, request, rows } = collector()
  const token = createTrackingToken(null, '/')
  const visitor = randomUUID()
  for (let index = 0; index < 100; index++) {
    const response = await collectAnalytics(
      request({ token, visitor, eventID: randomUUID(), eventType: 'click', action: 'hero_cta' }),
      payload,
    )
    assert.equal(response.status, 204)
  }
  assert.equal(
    (
      await collectAnalytics(
        request({ token, visitor, eventID: randomUUID(), eventType: 'click', action: 'hero_cta' }),
        payload,
      )
    ).status,
    429,
  )
  assert.equal(rows.length, 100)
})
