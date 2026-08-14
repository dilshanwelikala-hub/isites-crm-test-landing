import config from '@payload-config'
import { getPayload } from 'payload'

type SectionKey = 'curated' | 'partner' | 'events'

type LandingSection = {
  key: SectionKey
  label: string
  heading: string
  description?: string
}

type Action = {
  label?: string
  url?: string
}

type LandingPackage = {
  title: string
  category: SectionKey
  summary: string
  details?: string
  fallbackImageUrl?: string
  image?: {
    url?: string
    alt?: string
  }
  primaryAction?: Action
  secondaryAction?: Action
}

type LandingContent = {
  hero?: {
    eyebrow?: string
    title?: string
    description?: string
    fallbackImageUrl?: string
    image?: {
      url?: string
    }
  }
  intro?: {
    heading?: string
    body?: string
  }
  sections?: LandingSection[]
  newsletter?: {
    heading?: string
    body?: string
    buttonLabel?: string
  }
  footer?: {
    brand?: string
    address?: string
    phone?: string
  }
}

const defaultContent = {
  hero: {
    eyebrow: 'Packages',
    title: 'Packages & Experiences',
    description:
      'Enhance your stay with curated packages, local collaborations, and memorable seasonal events.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80',
  },
  intro: {
    heading: 'Choose the stay that fits the moment',
    body: 'From relaxed escapes to partner-led adventures, each offer is designed to make planning simple and the experience feel considered.',
  },
  sections: [
    {
      key: 'curated',
      label: 'Curated Getaways',
      heading: 'Curated Getaway Packages',
      description: 'Thoughtfully designed resort packages for an easier escape.',
    },
    {
      key: 'partner',
      label: 'Partner Experiences',
      heading: 'Featured Partner Experiences',
      description: 'Experiences offered with trusted local partners.',
    },
    {
      key: 'events',
      label: 'Ticketed Events',
      heading: 'Signature Ticketed Events',
      description: 'Seasonal dinners, celebrations, and resort events worth planning around.',
    },
  ],
  newsletter: {
    heading: 'Stay Connected',
    body: 'Keep up to date on the latest offers, events, and news.',
    buttonLabel: 'Sign up',
  },
  footer: {
    brand: 'The Test Resort',
    address: '70 Mountain Way, Essex, VT',
    phone: '802-878-1100',
  },
}

const defaultPackages: LandingPackage[] = [
  {
    title: 'Rise & Renew',
    category: 'curated',
    summary: 'A restorative escape with breakfast, spa time, and a slower start to the day.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'The Signature Escape',
    category: 'curated',
    summary: 'A polished weekend package with dining credit and room to unwind.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'Romantic Getaway',
    category: 'curated',
    summary: 'A thoughtful stay for two with quiet touches, dinner, and late checkout.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1501117716987-c8e1ecb2100f?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'Above Reality',
    category: 'partner',
    summary: 'Pair your stay with an unforgettable hot air balloon experience over open scenery.',
    details:
      'Book your stay through the resort, then reserve the flight directly with the partner operator.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1200&q=80',
    primaryAction: { label: 'Book your stay', url: '#' },
    secondaryAction: { label: 'Book your ride', url: '#' },
  },
  {
    title: 'Fish Tales',
    category: 'partner',
    summary: 'A guided outdoor experience shaped around the way you like to fish.',
    details: 'Our team helps connect guests with a local guide for a tailored day on the water.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    primaryAction: { label: 'Call to book', url: 'tel:8028781100' },
    secondaryAction: { label: 'Experience details', url: '#' },
  },
  {
    title: 'Summer Concert Series',
    category: 'events',
    summary: 'Preferred stay rates plus tickets when a partner performance lines up with your visit.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Learn more', url: '#' },
  },
  {
    title: 'Holiday Brunch',
    category: 'events',
    summary: 'Seasonal dining events for families, friends, and special occasions.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Learn more', url: '#' },
  },
]

async function getLandingData() {
  try {
    const payload = await getPayload({ config })
    const landingPage = await payload.findGlobal({
      slug: 'landing-page',
      depth: 2,
      draft: false,
    })
    const packages = await payload.find({
      collection: 'landing-packages',
      depth: 2,
      draft: false,
      limit: 50,
      sort: 'displayOrder',
      where: {
        _status: {
          equals: 'published',
        },
      },
    })

    return {
      content: (landingPage || defaultContent) as LandingContent,
      packages: packages.docs.length ? (packages.docs as unknown as LandingPackage[]) : defaultPackages,
    }
  } catch {
    return {
      content: defaultContent as LandingContent,
      packages: defaultPackages,
    }
  }
}

function imageFor(item: LandingPackage) {
  return item.image?.url || item.fallbackImageUrl || defaultContent.hero.fallbackImageUrl
}

function PackageActions({ item }: { item: LandingPackage }) {
  return (
    <div className="actions">
      {item.primaryAction?.url ? (
        <a className="button buttonPrimary" href={item.primaryAction.url}>
          {item.primaryAction.label || 'Book now'}
        </a>
      ) : null}
      {item.secondaryAction?.url ? (
        <a className="button buttonSecondary" href={item.secondaryAction.url}>
          {item.secondaryAction.label || 'View details'}
        </a>
      ) : null}
    </div>
  )
}

export default async function Page() {
  const { content, packages } = await getLandingData()
  const sections = content.sections?.length ? content.sections : defaultContent.sections
  const heroImage =
    content.hero?.image?.url || content.hero?.fallbackImageUrl || defaultContent.hero.fallbackImageUrl

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="/">
          {content.footer?.brand || defaultContent.footer.brand}
        </a>
        <nav aria-label="Package sections">
          {sections.map((section) => (
            <a key={section.key} href={`#${section.key}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <a className="headerCta" href="/admin">
          CMS Admin
        </a>
      </header>

      <section className="hero">
        <img src={heroImage} alt="" />
        <div className="heroOverlay" />
        <div className="heroContent">
          <p>{content.hero?.eyebrow || defaultContent.hero.eyebrow}</p>
          <h1>{content.hero?.title || defaultContent.hero.title}</h1>
          <span>{content.hero?.description || defaultContent.hero.description}</span>
          <a href="#curated">Explore offers</a>
        </div>
      </section>

      <section className="intro">
        <p>Packages & Experiences</p>
        <h2>{content.intro?.heading || defaultContent.intro.heading}</h2>
        <span>{content.intro?.body || defaultContent.intro.body}</span>
      </section>

      <div className="tabs" aria-label="Jump to package sections">
        {sections.map((section) => (
          <a key={section.key} href={`#${section.key}`}>
            {section.label}
          </a>
        ))}
      </div>

      {sections.map((section) => {
        const sectionPackages = packages.filter((item) => item.category === section.key)
        const isPartner = section.key === 'partner'

        return (
          <section className="packageSection" id={section.key} key={section.key}>
            <div className="sectionHeading">
              <p>{section.label}</p>
              <h2>{section.heading}</h2>
              {section.description ? <span>{section.description}</span> : null}
            </div>

            <div className={isPartner ? 'partnerList' : 'cardGrid'}>
              {sectionPackages.map((item) =>
                isPartner ? (
                  <article className="partnerCard" key={item.title}>
                    <img src={imageFor(item)} alt={item.image?.alt || item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      {item.details ? <span>{item.details}</span> : null}
                      <PackageActions item={item} />
                    </div>
                  </article>
                ) : (
                  <article className="packageCard" key={item.title}>
                    <img src={imageFor(item)} alt={item.image?.alt || item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <PackageActions item={item} />
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        )
      })}

      <section className="newsletter">
        <div>
          <p>Newsletter</p>
          <h2>{content.newsletter?.heading || defaultContent.newsletter.heading}</h2>
          <span>{content.newsletter?.body || defaultContent.newsletter.body}</span>
        </div>
        <form>
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" placeholder="you@example.com" type="email" />
          <button type="button">{content.newsletter?.buttonLabel || 'Sign up'}</button>
        </form>
      </section>

      <footer className="footer">
        <strong>{content.footer?.brand || defaultContent.footer.brand}</strong>
        <span>{content.footer?.address || defaultContent.footer.address}</span>
        <span>{content.footer?.phone || defaultContent.footer.phone}</span>
      </footer>
    </main>
  )
}
