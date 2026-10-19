import type { Payload } from 'payload'

export async function trackingEnabled(payload: Payload, site: number | null) {
  if (site === null) {
    const page = await payload.findGlobal({ slug: 'landing-page', depth: 0, draft: false })
    return page.analyticsEnabled === true
  }
  const page = await payload.findByID({
    collection: 'sites',
    id: site,
    depth: 0,
    draft: false,
    disableErrors: true,
  })
  return Boolean(
    page?.analyticsEnabled &&
    page._status === 'published' &&
    !['draft', 'archived'].includes(page.siteStatus || ''),
  )
}
