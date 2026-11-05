import type { AnalyticsEvent, AnalyticsInquiry, analyticsRange } from './analytics'
import { packageSlugFromPath } from './analyticsAttribution'

export const outcomeLabels = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal sent',
  won: 'Won',
  lost: 'Lost',
  closed: 'Closed',
  unknown: 'Unknown',
} as const

type Counters = {
  views: number
  clicks: number
  inquiries: number
  qualified: number
  proposals: number
  won: number
  visitors: Set<string>
  converted: Set<string>
}
type CampaignRow = Counters & { source: string; medium: string; campaign: string; key: string }
type PackageRow = Counters & { slug: string; title: string; titleAt: string }
const counters = (): Counters => ({
  views: 0,
  clicks: 0,
  inquiries: 0,
  qualified: 0,
  proposals: 0,
  won: 0,
  visitors: new Set(),
  converted: new Set(),
})

function campaignIdentity(
  version?: number | null,
  source?: string | null,
  medium?: string | null,
  campaign?: string | null,
  referrer?: string | null,
) {
  const labels =
    version === 2
      ? [source || referrer || 'Direct / unknown', medium || '(not set)', campaign || '(not set)']
      : ['Legacy / unattributed', '(not set)', '(not set)']
  return { source: labels[0], medium: labels[1], campaign: labels[2], key: JSON.stringify(labels) }
}

export function summarizePerformance(
  events: AnalyticsEvent[],
  inquiries: AnalyticsInquiry[],
  range: ReturnType<typeof analyticsRange>,
) {
  const campaigns = new Map<string, CampaignRow>()
  const packages = new Map<string, PackageRow>()
  const statuses = new Map<string, number>(Object.keys(outcomeLabels).map((status) => [status, 0]))
  const from = Date.parse(range.from)
  const until = Date.parse(range.until)
  const inside = (createdAt: string) =>
    Date.parse(createdAt) >= from && Date.parse(createdAt) < until
  const campaignRow = (identity: ReturnType<typeof campaignIdentity>) => {
    if (!campaigns.has(identity.key)) campaigns.set(identity.key, { ...counters(), ...identity })
    return campaigns.get(identity.key)!
  }
  const packageRow = (slug: string, title: string | null | undefined, createdAt: string) => {
    if (!packages.has(slug))
      packages.set(slug, {
        ...counters(),
        slug,
        title: title || slug,
        titleAt: title ? createdAt : '',
      })
    const row = packages.get(slug)!
    if (title && createdAt >= row.titleAt) {
      row.title = title
      row.titleAt = createdAt
    }
    return row
  }
  const addInquiry = (row: Counters, inquiry: AnalyticsInquiry) => {
    row.inquiries++
    if (inquiry.analyticsVisitor) row.converted.add(inquiry.analyticsVisitor)
    if (inquiry.status === 'qualified') row.qualified++
    if (inquiry.status === 'proposal_sent') row.proposals++
    if (inquiry.status === 'won') row.won++
  }
  for (const event of events) {
    if (!inside(event.createdAt) || !['page_view', 'click'].includes(event.eventType)) continue
    const campaign = campaignRow(
      campaignIdentity(
        event.attributionVersion,
        event.utmSource,
        event.utmMedium,
        event.utmCampaign,
        event.referrer,
      ),
    )
    const slug = event.packageSlug || packageSlugFromPath(event.path)
    const offer = slug ? packageRow(slug, event.packageTitle, event.createdAt) : undefined
    for (const row of [campaign, offer]) {
      if (!row) continue
      if (event.eventType === 'page_view') {
        row.views++
        row.visitors.add(event.visitor)
      } else row.clicks++
    }
  }
  let total = 0
  for (const inquiry of inquiries) {
    if (!inside(inquiry.createdAt) || !inquiry.analyticsVisitor) continue
    total++
    const status =
      inquiry.status && Object.hasOwn(outcomeLabels, inquiry.status) ? inquiry.status : 'unknown'
    statuses.set(status, statuses.get(status)! + 1)
    addInquiry(
      campaignRow(
        campaignIdentity(
          inquiry.analyticsAttributionVersion,
          inquiry.analyticsSource,
          inquiry.analyticsMedium,
          inquiry.analyticsCampaign,
          inquiry.analyticsReferrer,
        ),
      ),
      inquiry,
    )
    const slug =
      inquiry.analyticsPackageSlug ||
      (inquiry.analyticsPath ? packageSlugFromPath(inquiry.analyticsPath) : undefined)
    if (slug)
      addInquiry(packageRow(slug, inquiry.analyticsPackageTitle, inquiry.createdAt), inquiry)
  }
  const finish = <T extends Counters>(row: T) => {
    const { visitors, converted, ...rest } = row
    return {
      ...rest,
      visitors: visitors.size,
      conversion: visitors.size
        ? (Array.from(converted).filter((visitor) => visitors.has(visitor)).length /
            visitors.size) *
          100
        : 0,
      wonRate: row.inquiries ? (row.won / row.inquiries) * 100 : 0,
    }
  }
  return {
    campaigns: Array.from(campaigns.values(), finish).sort(
      (a, b) => b.inquiries - a.inquiries || b.visitors - a.visitors || a.key.localeCompare(b.key),
    ),
    packages: Array.from(packages.values(), finish).sort(
      (a, b) => b.inquiries - a.inquiries || b.views - a.views || a.slug.localeCompare(b.slug),
    ),
    outcomes: Array.from(statuses, ([status, count]) => ({
      status,
      label: outcomeLabels[status as keyof typeof outcomeLabels],
      count,
    })),
    total,
    won: statuses.get('won')!,
    wonRate: total ? (statuses.get('won')! / total) * 100 : 0,
  }
}
