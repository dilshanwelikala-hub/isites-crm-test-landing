import type { Payload, PayloadRequest } from 'payload'
import type { PackageAttribution } from './analyticsAttribution'

export async function trackingPackage(
  payload: Payload,
  site: number | null,
  slug: unknown,
): Promise<PackageAttribution | undefined> {
  if (typeof slug !== 'string' || !slug || slug.length > 200 || /[\x00-\x1f/?#\\]/.test(slug))
    return undefined
  const result = await payload.find({
    collection: 'landing-packages',
    depth: 0,
    limit: 1,
    draft: false,
    where: {
      and: [
        site === null ? { site: { exists: false } } : { site: { equals: site } },
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
    select: { slug: true, title: true },
  })
  const record = result.docs[0]
  return record ? { slug, title: record.title.slice(0, 200) } : undefined
}

export async function trackingEnabled(payload: Payload, site: number | null, req?: PayloadRequest) {
  if (site === null) {
    const page = await payload.findGlobal({
      slug: 'landing-page',
      depth: 0,
      draft: false,
      req,
      overrideAccess: false,
    })
    return page.analyticsEnabled === true
  }
  const page = await payload.findByID({
    collection: 'sites',
    req,
    overrideAccess: false,
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
