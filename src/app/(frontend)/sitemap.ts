import type { MetadataRoute } from 'next'

import config from '@payload-config'
import { getPayload } from 'payload'

import { defaultPackages } from '../../lib/landingDefaults'

function siteURL() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs = defaultPackages.map((item) => item.slug).filter(Boolean) as string[]
  let siteEntries: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload({ config })
    const rootPackages = await payload.find({
      collection: 'landing-packages',
      depth: 1,
      draft: false,
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
      limit: 100,
      where: {
        and: [
          {
            status: {
              equals: 'live',
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

    slugs = rootPackages.docs.map((item) => item.slug).filter(Boolean)
    siteEntries = sites.docs.flatMap((site) => {
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
          url: `${siteURL()}/sites/${siteSlug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        ...sitePackages.map((slug) => ({
          url: `${siteURL()}/sites/${siteSlug}/packages/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        })),
      ]
    })
  } catch {
    // Keep fallback demo package URLs in the sitemap.
  }

  return [
    {
      url: siteURL(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...slugs.map((slug) => ({
      url: `${siteURL()}/packages/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...siteEntries,
  ]
}
