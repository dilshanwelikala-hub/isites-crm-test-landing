import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import config from '@payload-config'
import { getPayload } from 'payload'

import { InquiryForm } from '../../components/InquiryForm'
import { defaultContent, defaultPackages, type LandingPackage } from '../../../../lib/landingDefaults'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function siteURL() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function previewEnabled(searchParams: Record<string, string | string[] | undefined> = {}) {
  const token = process.env.PREVIEW_SECRET || process.env.PAYLOAD_SECRET

  return Boolean(
    token &&
      firstParam(searchParams.preview) === 'true' &&
      firstParam(searchParams.previewToken) === token,
  )
}

async function findPackage(slug: string, isPreview = false): Promise<LandingPackage | null> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'landing-packages',
      depth: 2,
      draft: isPreview,
      limit: 1,
      where: isPreview
        ? {
            slug: {
              equals: slug,
            },
          }
        : {
            and: [
              {
                slug: {
                  equals: slug,
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

    if (result.docs[0]) {
      return result.docs[0] as unknown as LandingPackage
    }
  } catch {
    // Fall back to demo content when the CMS is unreachable.
  }

  return defaultPackages.find((item) => item.slug === slug) || null
}

function imageFor(item: LandingPackage) {
  return item.image?.url || item.fallbackImageUrl || defaultContent.hero?.fallbackImageUrl || ''
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const item = await findPackage(slug)

  if (!item) {
    return {
      title: 'Package Not Found',
    }
  }

  const title = `${item.title} | ${defaultContent.footer?.brand}`
  const image = imageFor(item)

  return {
    title,
    description: item.summary,
    alternates: {
      canonical: `${siteURL()}/packages/${slug}`,
    },
    openGraph: {
      title,
      description: item.summary,
      type: 'article',
      url: `${siteURL()}/packages/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: item.summary,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PackagePage({ params, searchParams }: Args) {
  const { slug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const isPreview = previewEnabled(resolvedSearchParams)
  const item = await findPackage(slug, isPreview)

  if (!item) {
    notFound()
  }

  const inclusions = item.inclusions?.filter((inclusion) => inclusion.item) || []

  return (
    <main>
      {isPreview ? <div className="previewBanner">Draft preview mode</div> : null}
      <header className="siteHeader">
        <a className="brand" href="/">
          {defaultContent.footer?.brand}
        </a>
        <nav aria-label="Package detail navigation">
          <a href="/#curated">Packages</a>
          <a href="/#partner">Experiences</a>
          <a href="/#events">Events</a>
        </nav>
        <a className="headerCta" href="/admin">
          CMS Admin
        </a>
      </header>

      <section className="detailHero">
        <img src={imageFor(item)} alt={item.image?.alt || item.title} />
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
          <InquiryForm packageSlug={item.slug} packageTitle={item.title} />
        </aside>
      </section>
    </main>
  )
}
