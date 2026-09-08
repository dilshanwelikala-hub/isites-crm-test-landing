import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { InquiryForm } from '../../../../components/InquiryForm'
import { defaultContent, type LandingContent, type LandingPackage } from '../../../../../../lib/landingDefaults'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

type Args = {
  params: Promise<{
    siteSlug: string
    slug: string
  }>
  searchParams?: Promise<SearchParams>
}

type SiteRecord = LandingContent & {
  id: number | string
  name?: string
  slug?: string
  status?: string
}

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

  return (result.docs[0] as unknown as SiteRecord) || null
}

async function findPackage(
  siteSlug: string,
  slug: string,
  isPreview = false,
): Promise<{ item: LandingPackage; site: SiteRecord } | null> {
  try {
    const payload = await getPayload({ config })
    const site = await findSite(siteSlug, isPreview)

    if (!site) {
      return null
    }

    const result = await payload.find({
      collection: 'landing-packages',
      depth: 2,
      draft: isPreview,
      limit: 1,
      where: {
        and: [
          {
            site: {
              equals: site.id,
            },
          },
          {
            slug: {
              equals: slug,
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

    if (result.docs[0]) {
      return {
        item: result.docs[0] as unknown as LandingPackage,
        site,
      }
    }
  } catch {
    return null
  }

  return null
}

function imageFor(item: LandingPackage, site: SiteRecord) {
  return (
    item.image?.url ||
    item.fallbackImageUrl ||
    site.hero?.image?.url ||
    site.hero?.fallbackImageUrl ||
    defaultContent.hero?.fallbackImageUrl ||
    ''
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { siteSlug, slug } = await params
  const data = await findPackage(siteSlug, slug)

  if (!data) {
    return {
      title: 'Package Not Found',
    }
  }

  const title = `${data.item.title} | ${data.site.footer?.brand || data.site.name || siteSlug}`
  const image = imageFor(data.item, data.site)

  return {
    title,
    description: data.item.summary,
    alternates: {
      canonical: `${siteURL()}/sites/${siteSlug}/packages/${slug}`,
    },
    openGraph: {
      title,
      description: data.item.summary,
      type: 'article',
      url: `${siteURL()}/sites/${siteSlug}/packages/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: data.item.summary,
      images: image ? [image] : undefined,
    },
  }
}

export default async function SitePackagePage({ params, searchParams }: Args) {
  const { siteSlug, slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isPreview = previewEnabled(resolvedSearchParams)
  const data = await findPackage(siteSlug, slug, isPreview)

  if (!data) {
    notFound()
  }

  const { item, site } = data
  const inclusions = item.inclusions?.filter((inclusion) => inclusion.item) || []

  return (
    <main>
      {isPreview ? <div className="previewBanner">Draft preview mode</div> : null}
      <header className="siteHeader">
        <a className="brand" href={`/sites/${siteSlug}`}>
          {site.footer?.brand || site.name || defaultContent.footer?.brand}
        </a>
        <nav aria-label="Package detail navigation">
          <a href={`/sites/${siteSlug}#curated`}>Packages</a>
          <a href={`/sites/${siteSlug}#partner`}>Experiences</a>
          <a href={`/sites/${siteSlug}#events`}>Events</a>
        </nav>
        <a className="headerCta" href="/admin">
          CMS Admin
        </a>
      </header>

      <section className="detailHero">
        <img src={imageFor(item, site)} alt={item.image?.alt || item.title} />
        <div>
          <p>{item.badge || 'Package'}</p>
          <h1>{item.title}</h1>
          <span>{item.summary}</span>
        </div>
      </section>

      <section className="detailBody">
        <article>
          <div className="packageMeta">
            {item.priceLabel ? <span>{item.priceLabel}</span> : null}
            {item.duration ? <span>{item.duration}</span> : null}
            <span>{item.category}</span>
          </div>
          {item.details ? <p>{item.details}</p> : <p>{item.summary}</p>}
          {inclusions.length ? (
            <>
              <h2>What is included</h2>
              <ul className="detailList">
                {inclusions.map((inclusion) => (
                  <li key={inclusion.item}>{inclusion.item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </article>

        <aside>
          <h2>Ask about this offer</h2>
          <InquiryForm packageSlug={item.slug} packageTitle={item.title} siteId={site.id} />
        </aside>
      </section>
    </main>
  )
}
