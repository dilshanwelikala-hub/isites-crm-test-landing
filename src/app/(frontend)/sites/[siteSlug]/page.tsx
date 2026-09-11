import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { LandingExperience } from '../../components/LandingExperience'
import {
  defaultContent,
  type LandingContent,
  type LandingPackage,
} from '../../../../lib/landingDefaults'
import { getSiteURL } from '../../../../lib/siteURL'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

type Args = {
  params: Promise<{
    siteSlug: string
  }>
  searchParams?: Promise<SearchParams>
}

type SiteRecord = LandingContent & {
  id: number | string
  name?: string
  slug?: string
  siteStatus?: string
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function previewEnabled(searchParams: SearchParams = {}) {
  const token = process.env.PREVIEW_SECRET || process.env.PAYLOAD_SECRET

  return Boolean(
    token &&
      firstParam(searchParams.preview) === 'true' &&
      firstParam(searchParams.previewToken) === token,
  )
}

async function findSite(siteSlug: string, isPreview = false): Promise<SiteRecord | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'sites',
    depth: 2,
    draft: isPreview,
    limit: 1,
    where: isPreview
      ? {
          slug: {
            equals: siteSlug,
          },
        }
      : {
          and: [
            {
              slug: {
                equals: siteSlug,
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

  const site = (result.docs[0] as unknown as SiteRecord) || null

  if (!site || (!isPreview && ['archived', 'draft'].includes(site.siteStatus || ''))) {
    return null
  }

  return site
}

async function getSiteLandingData(siteSlug: string, isPreview = false) {
  try {
    const payload = await getPayload({ config })
    const site = await findSite(siteSlug, isPreview)

    if (!site) {
      return null
    }

    const packages = await payload.find({
      collection: 'landing-packages',
      depth: 2,
      draft: isPreview,
      limit: 50,
      sort: 'displayOrder',
      where: {
        and: [
          {
            site: {
              equals: site.id,
            },
          },
          ...(isPreview
            ? []
            : [
                {
                  _status: {
                    equals: 'published',
                  },
                },
              ]),
        ],
      },
    })

    return {
      content: site as LandingContent,
      packages: packages.docs as unknown as LandingPackage[],
      site,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { siteSlug } = await params
  const data = await getSiteLandingData(siteSlug)

  if (!data) {
    return {
      title: 'Site Not Found',
    }
  }

  const title = data.content.seo?.title || `${data.site.name || siteSlug} | iSites CMS`
  const description = data.content.seo?.description || defaultContent.seo?.description
  const image =
    data.content.hero?.image?.url ||
    data.content.hero?.fallbackImageUrl ||
    defaultContent.hero?.fallbackImageUrl

  return {
    title,
    description,
    alternates: {
      canonical: `${getSiteURL()}/sites/${siteSlug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${getSiteURL()}/sites/${siteSlug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function SitePage({ params, searchParams }: Args) {
  const { siteSlug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isPreview = previewEnabled(resolvedSearchParams)
  const data = await getSiteLandingData(siteSlug, isPreview)

  if (!data) {
    notFound()
  }

  return (
    <LandingExperience
      basePath={`/sites/${siteSlug}`}
      content={data.content}
      isPreview={isPreview}
      packages={data.packages}
    />
  )
}
