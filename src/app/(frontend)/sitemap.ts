import type { MetadataRoute } from 'next'

import config from '@payload-config'
import { getPayload } from 'payload'

import { defaultPackages } from '../../lib/landingDefaults'

function siteURL() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let slugs = defaultPackages.map((item) => item.slug).filter(Boolean) as string[]

  try {
    const payload = await getPayload({ config })
    const packages = await payload.find({
      collection: 'landing-packages',
      draft: false,
      limit: 100,
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    slugs = packages.docs.map((item) => item.slug).filter(Boolean)
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
  ]
}
