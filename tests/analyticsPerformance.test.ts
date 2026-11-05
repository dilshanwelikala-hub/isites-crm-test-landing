import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { analyticsRange, type AnalyticsEvent, type AnalyticsInquiry } from '../src/lib/analytics'
import {
  campaignURL,
  campaignValue,
  firstTouchAttribution,
  packageSlugFromPath,
  parseAnalyticsTab,
  sanitizeAttribution,
} from '../src/lib/analyticsAttribution'
import { summarizePerformance } from '../src/lib/analyticsPerformance'
import { createTrackingToken, verifyTrackingToken } from '../src/lib/analyticsServer'

test('campaign links stay on the selected site and strip unrelated parameters', () => {
  const base = 'https://site.test/sites/resort'
  const link = new URL(
    campaignURL(
      base,
      `${base}/packages/weekend?private=secret#form`,
      'Email',
      'newsletter',
      'Summer Sale',
    ),
  )
  assert.equal(link.pathname, '/sites/resort/packages/weekend')
  assert.equal(link.searchParams.get('utm_campaign'), 'summer-sale')
  assert.equal(link.searchParams.get('private'), null)
  for (const destination of [
    'https://other.test',
    'https://secret:password@site.test/sites/resort',
    'https://site.test/admin',
    'https://site.test/sites/other',
    'javascript:alert(1)',
    `${base}/packages/weekend/extra`,
  ])
    assert.equal(campaignURL(base, destination, 'email', '', 'sale'), '')
  assert.notEqual(
    campaignURL('https://site.test/', 'https://site.test/packages/weekend', 'email', '', 'sale'),
    '',
  )
})
test('campaign labels are normalized and unsafe or oversized values are discarded', () => {
  assert.equal(campaignValue(' Summer Offers '), 'summer-offers')
  for (const value of [
    null,
    {},
    'test@example.com',
    'https://private.test/a',
    '<script>',
    'a'.repeat(81),
    '=formula',
  ])
    assert.equal(campaignValue(value), undefined)
  assert.equal(sanitizeAttribution(null), undefined)
  assert.equal(sanitizeAttribution([]), undefined)
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        sanitizeAttribution({
          source: 'NEWSLETTER',
          campaign: 'summer sale',
          referrer: 'search.test',
          email: 'secret@example.test',
        }),
      ),
    ),
    { source: 'newsletter', campaign: 'summer-sale', referrer: 'search.test' },
  )
  assert.equal(
    sanitizeAttribution({ referrer: 'https://search.test/private?token=secret' })?.referrer,
    undefined,
  )
})

test('first-touch attribution survives internal navigation and later campaign tags', () => {
  const visitor = randomUUID()
  const attribution = firstTouchAttribution(
    undefined,
    visitor,
    '?utm_source=email&utm_medium=newsletter&utm_campaign=autumn&email=private',
    'https://external.test/private?email=secret',
    'https://site.test',
  )
  assert.equal(attribution.source, 'email')
  assert.equal(attribution.referrer, 'external.test')
  assert.deepEqual(
    firstTouchAttribution(
      { visitor, attribution },
      visitor,
      '?utm_source=social',
      'https://site.test/',
      'https://site.test',
    ),
    attribution,
  )
  assert.equal(
    firstTouchAttribution(
      { visitor, attribution },
      randomUUID(),
      '?utm_source=social',
      '',
      'https://site.test',
    ).source,
    'social',
  )
  const direct = firstTouchAttribution(
    undefined,
    visitor,
    '',
    'https://site.test/',
    'https://site.test',
  )
  assert.equal(
    firstTouchAttribution(
      { visitor, attribution: direct },
      visitor,
      '?utm_source=social',
      '',
      'https://site.test',
    ).source,
    undefined,
  )
})

test('signed tokens preserve package snapshots and reject package tampering', () => {
  const token = createTrackingToken(12, '/sites/resort/packages/weekend', 1000, {
    slug: 'weekend',
    title: 'Weekend offer',
  })
  assert.deepEqual(verifyTrackingToken(token, 1001)?.offer, {
    slug: 'weekend',
    title: 'Weekend offer',
  })
  const [body, signature] = token.split('.')
  const data = JSON.parse(Buffer.from(body, 'base64url').toString())
  data.offer.slug = 'other'
  assert.equal(
    verifyTrackingToken(
      `${Buffer.from(JSON.stringify(data)).toString('base64url')}.${signature}`,
      1001,
    ),
    null,
  )
  assert.equal(packageSlugFromPath('/sites/resort/packages/weekend'), 'weekend')
  assert.equal(packageSlugFromPath('/packages/weekend%20offer'), 'weekend offer')
  for (const path of [
    '/admin/packages/weekend',
    '/packages/a/b',
    '/packages/%ZZ',
    '/packages/a%2Fb',
  ])
    assert.equal(packageSlugFromPath(path), undefined)
})

test('report selection rejects inherited keys and malformed values', () => {
  for (const tab of ['campaigns', 'packages', 'outcomes', 'overview'] as const)
    assert.equal(parseAnalyticsTab(tab), tab)
  for (const value of ['__proto__', 'toString', null, ['packages']])
    assert.equal(parseAnalyticsTab(value), 'overview')
})

const range = analyticsRange('2026-11-01', '2026-11-05', new Date('2026-11-05T12:00:00Z'))
const event = (values: Partial<AnalyticsEvent> = {}): AnalyticsEvent => ({
  createdAt: '2026-11-02T00:00:00.000Z',
  eventType: 'page_view',
  path: '/sites/resort',
  visitor: 'A',
  attributionVersion: 2,
  utmSource: 'email',
  utmMedium: 'newsletter',
  utmCampaign: 'autumn',
  ...values,
})
const inquiry = (values: Partial<AnalyticsInquiry> = {}): AnalyticsInquiry => ({
  createdAt: '2026-11-02T01:00:00.000Z',
  analyticsVisitor: 'A',
  status: 'qualified',
  analyticsAttributionVersion: 2,
  analyticsSource: 'email',
  analyticsMedium: 'newsletter',
  analyticsCampaign: 'autumn',
  analyticsPackageSlug: 'weekend',
  analyticsPackageTitle: 'Weekend offer',
  ...values,
})

test('campaign and package reports count distinct sessions and current outcomes', () => {
  const report = summarizePerformance(
    [
      event(),
      event({
        path: '/sites/resort/packages/weekend',
        packageSlug: 'weekend',
        packageTitle: 'Weekend offer',
      }),
      event({ eventType: 'click', action: 'package_details', packageSlug: 'weekend' }),
      event({ visitor: 'B', path: '/sites/resort/packages/weekend', packageSlug: 'weekend' }),
    ],
    [
      inquiry(),
      inquiry({ status: 'won' }),
      inquiry({ analyticsVisitor: 'B', status: 'proposal_sent' }),
    ],
    range,
  )
  assert.equal(report.campaigns.length, 1)
  assert.equal(report.campaigns[0].views, 3)
  assert.equal(report.campaigns[0].clicks, 1)
  assert.equal(report.campaigns[0].visitors, 2)
  assert.equal(report.campaigns[0].conversion, 100)
  assert.equal(report.campaigns[0].qualified, 1)
  assert.equal(report.campaigns[0].proposals, 1)
  assert.equal(report.campaigns[0].won, 1)
  assert.equal(report.packages[0].views, 2)
  assert.equal(report.packages[0].clicks, 1)
  assert.equal(report.packages[0].inquiries, 3)
  assert.equal(report.packages[0].conversion, 100)
  assert.equal(report.total, 3)
  assert.equal(
    report.outcomes.reduce((sum, row) => sum + row.count, 0),
    report.total,
  )
})

test('different campaigns and legacy records stay separate without fabricated attribution', () => {
  const report = summarizePerformance(
    [
      event({ utmCampaign: 'first' }),
      event({ utmCampaign: 'second' }),
      event({ attributionVersion: null, referrer: 'external.test' }),
      event({ utmSource: null, utmMedium: null, utmCampaign: null }),
    ],
    [
      inquiry({
        analyticsAttributionVersion: null,
        analyticsPackageSlug: null,
        analyticsPackageTitle: null,
      }),
    ],
    range,
  )
  assert.equal(report.campaigns.length, 4)
  const legacy = report.campaigns.find((row) => row.source === 'Legacy / unattributed')!
  assert.equal(legacy.inquiries, 1)
  assert.equal(legacy.views, 1)
  assert.equal(report.campaigns.find((row) => row.campaign === 'first')?.inquiries, 0)
  assert.equal(report.campaigns.find((row) => row.source === 'Direct / unknown')?.inquiries, 0)
})

test('reports honor cohort boundaries and recover only known legacy package paths', () => {
  const report = summarizePerformance(
    [
      event({ createdAt: '2026-10-31T23:59:59.999Z' }),
      event({ path: '/packages/legacy' }),
      event({ path: '/packages/new', packageSlug: 'new', packageTitle: 'Old title' }),
      event({
        path: '/packages/new',
        packageSlug: 'new',
        packageTitle: 'New title',
        createdAt: '2026-11-03T00:00:00.000Z',
      }),
      event({ createdAt: '2026-11-06T00:00:00.000Z' }),
    ],
    [
      inquiry({
        analyticsPackageSlug: null,
        analyticsPackageTitle: null,
        analyticsPath: '/packages/legacy',
        status: 'won',
      }),
      inquiry({ analyticsVisitor: null }),
      inquiry({ createdAt: '2026-11-06T00:00:00.000Z' }),
    ],
    range,
  )
  assert.equal(report.total, 1)
  assert.equal(report.packages.find((row) => row.slug === 'legacy')?.inquiries, 1)
  assert.equal(report.packages.find((row) => row.slug === 'new')?.title, 'New title')
  assert.equal(report.campaigns[0].views, 3)
  const empty = summarizePerformance([], [], range)
  assert.equal(empty.wonRate, 0)
  assert.deepEqual(empty.packages, [])
})
