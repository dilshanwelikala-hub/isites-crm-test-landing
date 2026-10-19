export const analyticsActions = {
  hero_cta: 'Hero button',
  package_primary: 'Package primary button',
  package_secondary: 'Package secondary button',
  package_details: 'Package details',
  alert_cta: 'Announcement button',
  newsletter_cta: 'Newsletter button',
  phone: 'Phone link',
  email: 'Email link',
} as const

export type AnalyticsAction = keyof typeof analyticsActions
export type AnalyticsEvent = {
  createdAt: string
  eventType: string
  visitor: string
  path: string
  action?: string | null
  referrer?: string | null
}
export type AnalyticsInquiry = { createdAt: string; analyticsVisitor?: string | null }

export function analyticsHref(siteID?: string | number) {
  return `/admin?workspace=cms&view=analytics&site=${encodeURIComponent(String(siteID ?? 'default'))}`
}

export function analyticsRange(start: unknown, end: unknown, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const validDate = (value: unknown): value is string =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  const until = validDate(end) && end <= today ? end : today
  const defaultStart = new Date(`${until}T00:00:00Z`)
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 29)
  const minimum = new Date(`${until}T00:00:00Z`)
  minimum.setUTCDate(minimum.getUTCDate() - 89)
  const from =
    validDate(start) && start <= until
      ? start < minimum.toISOString().slice(0, 10)
        ? minimum.toISOString().slice(0, 10)
        : start
      : defaultStart.toISOString().slice(0, 10)
  const exclusiveEnd = new Date(`${until}T00:00:00Z`)
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)
  return {
    start: from,
    end: until,
    from: `${from}T00:00:00.000Z`,
    until: exclusiveEnd.toISOString(),
  }
}

export function summarizeAnalytics(
  events: AnalyticsEvent[],
  inquiries: AnalyticsInquiry[],
  range: ReturnType<typeof analyticsRange>,
) {
  const days = new Map<string, { date: string; views: number; inquiries: number }>()
  for (let time = Date.parse(range.from); time < Date.parse(range.until); time += 86400000) {
    const date = new Date(time).toISOString().slice(0, 10)
    days.set(date, { date, views: 0, inquiries: 0 })
  }
  const visitors = new Set<string>()
  const converted = new Set<string>()
  const pages = new Map<string, number>()
  const actions = new Map<string, number>()
  const sources = new Map<string, number>()
  let views = 0
  let clicks = 0
  for (const event of events) {
    const day = days.get(event.createdAt.slice(0, 10))
    if (!day) continue
    if (event.eventType === 'page_view') {
      views++
      day.views++
      visitors.add(event.visitor)
      pages.set(event.path, (pages.get(event.path) || 0) + 1)
      const source = event.referrer || 'Direct / unknown'
      sources.set(source, (sources.get(source) || 0) + 1)
    } else if (
      event.eventType === 'click' &&
      event.action &&
      Object.hasOwn(analyticsActions, event.action)
    ) {
      clicks++
      actions.set(event.action, (actions.get(event.action) || 0) + 1)
    }
  }
  let totalInquiries = 0
  for (const inquiry of inquiries) {
    const day = days.get(inquiry.createdAt.slice(0, 10))
    if (!day) continue
    totalInquiries++
    day.inquiries++
    if (inquiry.analyticsVisitor && visitors.has(inquiry.analyticsVisitor))
      converted.add(inquiry.analyticsVisitor)
  }
  const sorted = (map: Map<string, number>) =>
    Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
  return {
    views,
    clicks,
    visitors: visitors.size,
    inquiries: totalInquiries,
    conversion: visitors.size ? (converted.size / visitors.size) * 100 : 0,
    days: Array.from(days.values()),
    pages: sorted(pages),
    actions: sorted(actions),
    sources: sorted(sources),
  }
}
