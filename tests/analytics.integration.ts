import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import type { Payload } from 'payload'

import { collectAnalytics } from '../src/lib/collectAnalytics'
import { analyticsVisitor, createTrackingToken } from '../src/lib/analyticsServer'
import { trackingPackage } from '../src/lib/analyticsCollection'
import { analyticsRange } from '../src/lib/analytics'
import { summarizePerformance } from '../src/lib/analyticsPerformance'

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

test('campaign and package attribution persists and current CRM status drives outcomes', async () => {
  const user = await payload.create({
    collection: 'users',
    data: { email: 'analytics-admin@example.test', password: randomUUID() },
  })
  await payload.create({
    collection: 'landing-packages',
    data: {
      title: 'Site A Weekend',
      slug: 'weekend',
      summary: 'Test package',
      site: siteA,
      category: 'curated',
      _status: 'published',
    },
  })
  await payload.create({
    collection: 'landing-packages',
    data: {
      title: 'Site B Only',
      slug: 'other-only',
      summary: 'Test package',
      site: siteB,
      category: 'curated',
      _status: 'published',
    },
  })
  assert.equal((await trackingPackage(payload, siteA, 'weekend'))?.title, 'Site A Weekend')
  assert.equal(await trackingPackage(payload, siteA, 'other-only'), undefined)
  assert.equal(await trackingPackage(payload, null, 'weekend'), undefined)
  const visitor = randomUUID()
  const attribution = {
    source: 'Email',
    medium: 'Newsletter',
    campaign: 'Autumn Sale',
    referrer: 'external.test',
    email: 'private@example.test',
  }
  const token = createTrackingToken(siteA, '/sites/qa-resort/packages/weekend', Date.now(), {
    slug: 'weekend',
    title: 'Site A Weekend',
  })
  await collectAnalytics(
    new Request('http://localhost/api/analytics', {
      method: 'POST',
      headers: { origin: 'http://localhost', 'content-type': 'application/json' },
      body: JSON.stringify({
        token,
        visitor,
        eventType: 'page_view',
        attribution,
        packageTitle: 'Fake',
      }),
    }),
    payload,
  )
  const lead = await payload.create({
    collection: 'inquiries',
    req: { payloadAPI: 'REST' },
    data: {
      name: 'Campaign lead',
      consentToContact: true,
      email: 'campaign@example.test',
      message: 'Testing',
      site: siteA,
      packageSlug: 'weekend',
      status: 'won',
      analyticsInput: { token, visitor, attribution },
      analyticsSource: 'forged',
    },
  })
  assert.equal(lead.status, 'new')
  assert.equal(lead.analyticsSource, 'email')
  assert.equal(lead.analyticsMedium, 'newsletter')
  assert.equal(lead.analyticsCampaign, 'autumn-sale')
  assert.equal(lead.analyticsReferrer, 'external.test')
  assert.equal(lead.analyticsPackageTitle, 'Site A Weekend')
  assert.equal(lead.analyticsPackageSlug, 'weekend')
  assert.equal(lead.analyticsAttributionVersion, 2)
  const won = await payload.update({
    collection: 'inquiries',
    id: lead.id,
    user,
    data: {
      status: 'won',
      analyticsSource: 'forged',
      analyticsCampaign: 'forged',
      analyticsPackageTitle: 'forged',
    },
  })
  assert.equal(won.analyticsSource, 'email')
  assert.equal(won.analyticsPackageTitle, 'Site A Weekend')
  const events = await payload.find({
    collection: 'analytics-events',
    depth: 0,
    where: { visitor: { equals: analyticsVisitor(visitor, siteA) } },
  })
  assert.equal(events.docs[0].utmCampaign, 'autumn-sale')
  assert.equal(events.docs[0].packageTitle, 'Site A Weekend')
  assert.equal(events.docs[0].attributionVersion, 2)
  const report = summarizePerformance(events.docs, [won], analyticsRange(undefined, undefined))
  assert.equal(report.campaigns[0].won, 1)
  assert.equal(report.packages[0].won, 1)
  assert.equal(report.wonRate, 100)
  const moved = await payload.update({
    collection: 'inquiries',
    id: lead.id,
    data: { site: siteB },
    user,
  })
  assert.equal(moved.analyticsCampaign, null)
  assert.equal(moved.analyticsPackageSlug, null)
  assert.equal(moved.analyticsAttributionVersion, null)
})

test('package click attribution uses published records belonging to the signed site', async () => {
  const visitor = randomUUID()
  const token = createTrackingToken(siteA, '/sites/qa-resort')
  for (const slug of ['weekend', 'other-only']) {
    await collectAnalytics(
      new Request('http://localhost/api/analytics', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          visitor,
          eventType: 'click',
          eventID: randomUUID(),
          action: 'package_details',
          packageSlug: slug,
          packageTitle: 'Forged title',
          attribution: {},
        }),
      }),
      payload,
    )
  }
  const result = await payload.find({
    collection: 'analytics-events',
    depth: 0,
    where: { visitor: { equals: analyticsVisitor(visitor, siteA) } },
    sort: 'id',
  })
  assert.equal(result.docs[0].packageSlug, 'weekend')
  assert.equal(result.docs[0].packageTitle, 'Site A Weekend')
  assert.equal(result.docs[1].packageSlug, null)
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
