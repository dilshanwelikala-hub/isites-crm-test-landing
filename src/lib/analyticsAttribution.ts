export type CampaignAttribution = {
  source?: string
  medium?: string
  campaign?: string
  referrer?: string
}
export type PackageAttribution = { slug: string; title: string }

export function campaignValue(value: unknown) {
  if (typeof value !== 'string' || value.length > 80) return undefined
  const label = value.trim().toLowerCase().replace(/\s+/g, '-')
  return /^[a-z0-9][a-z0-9._-]{0,79}$/.test(label) ? label : undefined
}

export function sanitizeAttribution(value: unknown): CampaignAttribution | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const input = value as Record<string, unknown>
  let referrer: string | undefined
  if (
    typeof input.referrer === 'string' &&
    input.referrer.length <= 253 &&
    /^[a-z0-9.-]+$/i.test(input.referrer)
  ) {
    try {
      const url = new URL(`https://${input.referrer}`)
      if (url.hostname === input.referrer.toLowerCase()) referrer = url.hostname
    } catch {
      /* Ignore malformed hostnames. */
    }
  }
  return {
    source: campaignValue(input.source),
    medium: campaignValue(input.medium),
    campaign: campaignValue(input.campaign),
    referrer,
  }
}

export function firstTouchAttribution(
  previous: unknown,
  visitor: string,
  search: string,
  referrerURL: string,
  origin: string,
) {
  if (previous && typeof previous === 'object' && !Array.isArray(previous)) {
    const record = previous as Record<string, unknown>
    const saved = sanitizeAttribution(record.attribution)
    if (record.visitor === visitor && saved) return saved
  }
  const params = new URLSearchParams(search)
  let referrer: string | undefined
  try {
    const url = new URL(referrerURL)
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== origin) referrer = url.hostname
  } catch {
    /* No external referrer. */
  }
  return sanitizeAttribution({
    source: params.get('utm_source'),
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
    referrer,
  })!
}

export function packageSlugFromPath(path: string) {
  const match = /^(?:\/sites\/[^/]+)?\/packages\/([^/]+)\/?$/.exec(path)
  if (!match) return undefined
  try {
    const slug = decodeURIComponent(match[1])
    return slug.length <= 200 && !/[\x00-\x1f/?#\\]/.test(slug) ? slug : undefined
  } catch {
    return undefined
  }
}

export function campaignURL(
  baseURL: string,
  destination: string,
  source: string,
  medium: string,
  campaign: string,
) {
  if (!campaignValue(source) || !campaignValue(campaign) || (medium && !campaignValue(medium)))
    return ''
  try {
    const base = new URL(baseURL)
    const url = new URL(destination)
    if (!['http:', 'https:'].includes(base.protocol) || url.username || url.password) return ''
    const root = base.pathname.replace(/\/$/, '')
    if (
      url.origin !== base.origin ||
      (url.pathname.replace(/\/$/, '') !== root &&
        !(url.pathname.startsWith(`${root}/packages/`) && packageSlugFromPath(url.pathname)))
    )
      return ''
    url.search = ''
    url.hash = ''
    url.searchParams.set('utm_source', campaignValue(source)!)
    if (medium) url.searchParams.set('utm_medium', campaignValue(medium)!)
    url.searchParams.set('utm_campaign', campaignValue(campaign)!)
    return url.toString()
  } catch {
    return ''
  }
}

export const analyticsTabs = {
  overview: 'Overview',
  campaigns: 'Campaigns',
  packages: 'Packages',
  outcomes: 'Lead outcomes',
} as const
export type AnalyticsTab = keyof typeof analyticsTabs
export function parseAnalyticsTab(value: unknown): AnalyticsTab {
  return typeof value === 'string' && Object.hasOwn(analyticsTabs, value)
    ? (value as AnalyticsTab)
    : 'overview'
}
