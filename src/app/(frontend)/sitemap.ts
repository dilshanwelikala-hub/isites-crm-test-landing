import type { MetadataRoute } from 'next'

import config from '@payload-config'
import { getPayload } from 'payload'

import { getSiteURL } from '../../lib/siteURL'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs: string[] = []
  let siteEntries: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })
    const rootPackages = await payload.find({
      collection: 'landing-packages',
      depth: 1,
      draft: false,
      overrideAccess: false,
      limit: 100,
      where: {
        and: [
          {
            site: {
              exists: false,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })
    const sitePackagesResult = await payload.find({
      collection: 'landing-packages',
      depth: 1,
      draft: false,
      overrideAccess: false,
      limit: 500,
      where: {
        and: [
          {
            site: {
              exists: true,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })
    const sites = await payload.find({
      collection: 'sites',
      draft: false,
      overrideAccess: false,
      limit: 100,
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })

    slugs = rootPackages.docs.map((item) => item.slug).filter(Boolean)
    siteEntries = sites.docs.flatMap((site) => {
      if (['archived', 'draft'].includes(site.siteStatus || '')) {
        return []
      }

      const siteSlug = site.slug

      if (!siteSlug) {
        return []
      }

      const sitePackages = sitePackagesResult.docs
        .filter((item) => {
          const itemSite = item.site

          return typeof itemSite === 'object' && itemSite?.id === site.id
        })
        .map((item) => item.slug)
        .filter(Boolean)

      return [
        {
          url: `${getSiteURL()}/sites/${siteSlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        ...sitePackages.map((slug) => ({
          url: `${getSiteURL()}/sites/${siteSlug}/packages/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        })),
      ]
    })
  } catch {
    // Never publish fallback URLs for missing or unpublished records.
  }

  return [
    {
      url: getSiteURL(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...slugs.map((slug) => ({
      url: `${getSiteURL()}/packages/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...siteEntries,
  ]
}
