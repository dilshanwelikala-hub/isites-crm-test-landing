import { defaultContent, type LandingContent, type LandingPackage } from '../../../lib/landingDefaults'

type LandingExperienceProps = {
  basePath?: string
  content: LandingContent
  isPreview?: boolean
  packages: LandingPackage[]
}

function imageFor(item: LandingPackage) {
  return item.image?.url || item.fallbackImageUrl || defaultContent.hero?.fallbackImageUrl || ''
}

function PackageActions({ basePath = '', item }: { basePath?: string; item: LandingPackage }) {
  const packagePath = `${basePath}/packages/${item.slug}`.replace(/^\/\//, '/')

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
      {item.slug ? (
        <a className="button buttonSecondary" href={packagePath}>
          Package page
        </a>
      ) : null}
    </div>
  )
}

function PackageMeta({ item }: { item: LandingPackage }) {
  const meta = [item.priceLabel, item.duration].filter(Boolean)

  if (!item.badge && !meta.length) {
    return null
  }

  return (
    <div className="packageMeta">
      {item.badge ? <span>{item.badge}</span> : null}
      {meta.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  )
}

function PackageInclusions({ item }: { item: LandingPackage }) {
  const inclusions = item.inclusions?.filter((inclusion) => inclusion.item)

  if (!inclusions?.length) {
    return null
  }

  return (
    <ul className="inclusions">
      {inclusions.slice(0, 3).map((inclusion) => (
        <li key={inclusion.item}>{inclusion.item}</li>
      ))}
    </ul>
  )
}

export function LandingExperience({
  basePath = '',
  content,
  isPreview = false,
  packages,
}: LandingExperienceProps) {
  const sections = content.sections?.length ? content.sections : defaultContent.sections || []
  const stats = content.stats?.length ? content.stats : defaultContent.stats || []
  const heroImage =
    content.hero?.image?.url || content.hero?.fallbackImageUrl || defaultContent.hero?.fallbackImageUrl
  const heroAlt = content.hero?.image?.alt || content.hero?.title || defaultContent.hero?.title || ''
  const homePath = basePath || '/'

  return (
    <main>
      {isPreview ? <div className="previewBanner">Draft preview mode</div> : null}
      <header className="siteHeader">
        <a className="brand" href={homePath}>
          {content.footer?.brand || defaultContent.footer?.brand}
        </a>
        <nav aria-label="Package sections">
          {sections.map((section) => (
            <a key={section.key} href={`${homePath === '/' ? '' : homePath}#${section.key}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <a className="headerCta" href="/admin">
          CMS Admin
        </a>
      </header>

      <section className="hero">
        {heroImage ? <img src={heroImage} alt={heroAlt} /> : null}
        <div className="heroOverlay" />
        <div className="heroContent">
          <p>{content.hero?.eyebrow || defaultContent.hero?.eyebrow}</p>
          <h1>{content.hero?.title || defaultContent.hero?.title}</h1>
          <span>{content.hero?.description || defaultContent.hero?.description}</span>
          <a href={content.hero?.ctaUrl || defaultContent.hero?.ctaUrl || '#curated'}>
            {content.hero?.ctaLabel || defaultContent.hero?.ctaLabel || 'Explore offers'}
          </a>
        </div>
      </section>

      {content.alert?.text ? (
        <section className="alertBand">
          <strong>{content.alert.label || 'Update'}</strong>
          <span>{content.alert.text}</span>
          {content.alert.linkUrl ? (
            <a href={content.alert.linkUrl}>{content.alert.linkLabel || 'Learn more'}</a>
          ) : null}
        </section>
      ) : null}

      <section className="intro">
        <p>{content.intro?.eyebrow || defaultContent.intro?.eyebrow}</p>
        <div>
          <h2>{content.intro?.heading || defaultContent.intro?.heading}</h2>
          <span>{content.intro?.body || defaultContent.intro?.body}</span>
        </div>
      </section>

      {stats.length ? (
        <section className="stats" aria-label="Landing page highlights">
          {stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>
      ) : null}

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

            {sectionPackages.length ? (
              <div className={isPartner ? 'partnerList' : 'cardGrid'}>
                {sectionPackages.map((item) =>
                  isPartner ? (
                    <article className="partnerCard" key={item.slug || item.title}>
                      <img src={imageFor(item)} alt={item.image?.alt || item.title} />
                      <div>
                        <PackageMeta item={item} />
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        {item.details ? <span>{item.details}</span> : null}
                        <PackageInclusions item={item} />
                        <PackageActions basePath={basePath} item={item} />
                      </div>
                    </article>
                  ) : (
                    <article className="packageCard" key={item.slug || item.title}>
                      <img src={imageFor(item)} alt={item.image?.alt || item.title} />
                      <div>
                        <PackageMeta item={item} />
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <PackageInclusions item={item} />
                        <PackageActions basePath={basePath} item={item} />
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p className="emptyState">No published offers in this section yet.</p>
            )}
          </section>
        )
      })}

      <section className="feature">
        <div>
          <p>{content.feature?.eyebrow || defaultContent.feature?.eyebrow}</p>
          <h2>{content.feature?.heading || defaultContent.feature?.heading}</h2>
        </div>
        <div>
          <span>{content.feature?.body || defaultContent.feature?.body}</span>
          <ul>
            {(content.feature?.points?.length
              ? content.feature.points
              : defaultContent.feature?.points || []
            ).map((point) => (point.item ? <li key={point.item}>{point.item}</li> : null))}
          </ul>
        </div>
      </section>

      <section className="newsletter">
        <div>
          <p>{content.newsletter?.eyebrow || defaultContent.newsletter?.eyebrow}</p>
          <h2>{content.newsletter?.heading || defaultContent.newsletter?.heading}</h2>
          <span>{content.newsletter?.body || defaultContent.newsletter?.body}</span>
        </div>
        <form>
          <label htmlFor="email">Email address</label>
          <input id="email" name="email" placeholder="you@example.com" type="email" />
          <a className="newsletterButton" href={content.newsletter?.buttonUrl || '#'}>
            {content.newsletter?.buttonLabel || 'Sign up'}
          </a>
        </form>
      </section>

      <footer className="footer">
        <strong>{content.footer?.brand || defaultContent.footer?.brand}</strong>
        <span>{content.footer?.address || defaultContent.footer?.address}</span>
        <span>{content.footer?.phone || defaultContent.footer?.phone}</span>
        {content.footer?.email ? <a href={`mailto:${content.footer.email}`}>{content.footer.email}</a> : null}
      </footer>
    </main>
  )
}
