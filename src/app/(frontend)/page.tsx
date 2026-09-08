import type { Metadata } from 'next'

import config from '@payload-config'
import { getPayload } from 'payload'

import {
  defaultContent,
  defaultPackages,
  type LandingContent,
  type LandingPackage,
} from '../../lib/landingDefaults'
import { LandingExperience } from './components/LandingExperience'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function siteURL() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
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

async function getLandingData(isPreview = false) {
  try {
    const payload = await getPayload({ config })
    const landingPage = await payload.findGlobal({
      slug: 'landing-page',
      depth: 2,
      draft: isPreview,
    })
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
              exists: false,
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
      content: (landingPage || defaultContent) as LandingContent,
      packages: packages.docs.length ? (packages.docs as unknown as LandingPackage[]) : defaultPackages,
    }
  } catch {
    return {
      content: defaultContent,
      packages: defaultPackages,
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getLandingData()
  const title = content.seo?.title || defaultContent.seo?.title
  const description = content.seo?.description || defaultContent.seo?.description
  const image =
    content.hero?.image?.url || content.hero?.fallbackImageUrl || defaultContent.hero?.fallbackImageUrl

  return {
    title,
    description,
    alternates: {
      canonical: siteURL(),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: siteURL(),
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

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isPreview = previewEnabled(resolvedSearchParams)
  const { content, packages } = await getLandingData(isPreview)

  return <LandingExperience content={content} isPreview={isPreview} packages={packages} />
}
