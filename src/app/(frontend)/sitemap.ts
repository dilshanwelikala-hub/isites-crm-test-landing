import type { MetadataRoute } from 'next'

function siteURL() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteURL(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
