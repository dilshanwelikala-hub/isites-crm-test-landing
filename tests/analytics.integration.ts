import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import type { Payload } from 'payload'

import { collectAnalytics } from '../src/lib/collectAnalytics'
import { analyticsVisitor, createTrackingToken } from '../src/lib/analyticsServer'

let payload: Payload
let directory: string
let siteA: number
let siteB: number

before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'isites-analytics-'))
  Object.assign(process.env, {
    DATABASE_URL: '',
    POSTGRES_URL: '',
    BLOB_READ_WRITE_TOKEN: '',
    VERCEL_BLOB_READ_WRITE_TOKEN: '',
    DATABASE_URI: `file:${path.join(directory, 'qa.db').replaceAll('\\', '/')}`,
    PAYLOAD_SECRET: randomUUID(),
    NODE_ENV: 'development',
  })
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  payload = await getPayload({ config })
  const first = await payload.create({
    collection: 'sites',
    data: {
      name: 'QA Resort',
      slug: 'qa-resort',
      hero: { title: 'QA Resort' },
      analyticsEnabled: true,
      _status: 'published',
    },
  })
  const second = await payload.create({
    collection: 'sites',
    data: {
      name: 'QA Other',
      slug: 'qa-other',
      hero: { title: 'QA Other' },
      analyticsEnabled: true,
      _status: 'published',
    },
  })
  siteA = first.id
  siteB = second.id
  await payload.updateGlobal({
    slug: 'landing-page',
    data: { analyticsEnabled: true, _status: 'published' },
  })
})

after(async () => {
  await payload?.db.destroy?.()
  ;(payload?.db as unknown as { client?: { close(): void } })?.client?.close()
  if (directory) {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('isites-analytics-'))
    await rm(directory, { recursive: true, force: true, maxRetries: 6, retryDelay: 200 })
  }
})

test('real SQL storage keeps sites separate, enforces event access, and deduplicates views', async () => {
  const visitor = randomUUID()
  const token = createTrackingToken(siteA, '/sites/qa-resort')
  const send = () =>
    collectAnalytics(
      new Request('http://localhost/api/analytics', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({ token, visitor, eventType: 'page_view' }),
      }),
      payload,
    )
  assert.equal((await send()).status, 204)
  assert.equal((await send()).status, 204)
  const rows = await payload.find({
    collection: 'analytics-events',
    where: { site: { equals: siteA } },
    depth: 0,
  })
  assert.equal(rows.totalDocs, 1)
  assert.equal(rows.docs[0].visitor, analyticsVisitor(visitor, siteA))
  assert.equal(
    (await payload.count({ collection: 'analytics-events', where: { site: { equals: siteB } } }))
      .totalDocs,
    0,
  )
  await assert.rejects(payload.find({ collection: 'analytics-events', overrideAccess: false }))
  await assert.rejects(
    payload.create({ collection: 'analytics-events', overrideAccess: false, data: rows.docs[0] }),
  )
  await assert.rejects(
    payload.create({ collection: 'analytics-events', data: { ...rows.docs[0], id: undefined } }),
  )
})

test('only successfully saved inquiries receive verified attribution, never forged fields', async () => {
  const visitor = randomUUID()
  const token = createTrackingToken(siteA, '/sites/qa-resort/packages/offer')
  const data = { name: 'QA Lead', email: 'qa@example.test', message: 'QA inquiry', site: siteA }
  const inquiry = await payload.create({
    collection: 'inquiries',
    data: { ...data, analyticsInput: { token, visitor } },
  })
  assert.equal(inquiry.analyticsVisitor, analyticsVisitor(visitor, siteA))
  assert.equal(inquiry.analyticsPath, '/sites/qa-resort/packages/offer')
  assert.equal(inquiry.analyticsInput, undefined)
  const forged = await payload.create({
    collection: 'inquiries',
    data: {
      ...data,
      site: siteB,
      analyticsInput: { token, visitor },
      analyticsVisitor: 'forged',
      analyticsPath: '/forged',
    },
  })
  assert.equal(forged.analyticsVisitor, null)
  assert.equal(forged.analyticsPath, null)
  const updated = await payload.update({
    collection: 'inquiries',
    id: inquiry.id,
    data: { analyticsVisitor: 'forged', analyticsPath: '/forged' },
  })
  assert.equal(updated.analyticsVisitor, inquiry.analyticsVisitor)
  const moved = await payload.update({
    collection: 'inquiries',
    id: inquiry.id,
    data: { site: siteB },
  })
  assert.equal(moved.analyticsVisitor, null)
  assert.equal(moved.analyticsPath, null)
  const before = await payload.count({ collection: 'inquiries' })
  await assert.rejects(
    payload.create({
      collection: 'inquiries',
      data: { ...data, email: 'invalid', analyticsInput: { token, visitor } },
    }),
  )
  assert.equal((await payload.count({ collection: 'inquiries' })).totalDocs, before.totalDocs)
})

test('disabled tracking does not attribute new inquiries', async () => {
  await payload.update({
    collection: 'sites',
    id: siteA,
    data: { analyticsEnabled: false, _status: 'published' },
  })
  const inquiry = await payload.create({
    collection: 'inquiries',
    data: {
      name: 'QA',
      email: 'other@example.test',
      message: 'Test',
      site: siteA,
      analyticsInput: {
        token: createTrackingToken(siteA, '/sites/qa-resort'),
        visitor: randomUUID(),
      },
    },
  })
  assert.equal(inquiry.analyticsVisitor, null)
})
