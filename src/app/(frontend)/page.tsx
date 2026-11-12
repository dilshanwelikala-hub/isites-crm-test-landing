import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { defaultContent, type LandingContent, type LandingPackage } from '../../lib/landingDefaults'
import { getSiteURL } from '../../lib/siteURL'
import { LandingExperience } from './components/LandingExperience'
import { SiteAnalytics } from './components/SiteAnalytics'
import { previewEnabled } from '../../lib/preview'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

async function getLandingData(isPreview = false) {
  const payload = await getPayload({ config })
  const landingPage = await payload.findGlobal({
    slug: 'landing-page',
    depth: 2,
    draft: isPreview,
    overrideAccess: isPreview,
  })
  if (!isPreview && landingPage._status !== 'published') notFound()
  const packages = await payload.find({
    collection: 'landing-packages',
    depth: 2,
    draft: isPreview,
    overrideAccess: isPreview,
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
    packages: packages.docs as unknown as LandingPackage[],
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}): Promise<Metadata> {
  const isPreview = previewEnabled(searchParams ? await searchParams : {}, '/')
  const { content } = await getLandingData(isPreview)
  const title = content.seo?.title || defaultContent.seo?.title
  const description = content.seo?.description || defaultContent.seo?.description
  const image =
    content.hero?.image?.url ||
    content.hero?.fallbackImageUrl ||
    defaultContent.hero?.fallbackImageUrl

  return {
    ...(isPreview
      ? { robots: { index: false, follow: false }, referrer: 'no-referrer' as const }
      : {}),
    title,
    description,
    alternates: {
      canonical: getSiteURL(),
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: getSiteURL(),
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

export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isPreview = previewEnabled(resolvedSearchParams, '/')
  const { content, packages } = await getLandingData(isPreview)

  return (
    <SiteAnalytics path="/" preview={isPreview}>
      <LandingExperience content={content} isPreview={isPreview} packages={packages} />
    </SiteAnalytics>
  )
}
