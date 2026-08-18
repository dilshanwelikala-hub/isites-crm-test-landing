import type { ServerProps } from 'payload'

const quickActions = [
  {
    label: 'Edit homepage',
    href: '/admin/globals/landing-page',
    description: 'Hero, SEO, sections, footer, and publishing.',
  },
  {
    label: 'Manage packages',
    href: '/admin/collections/landing-packages',
    description: 'Offers, details, categories, and package pages.',
  },
  {
    label: 'Review inquiries',
    href: '/admin/collections/inquiries',
    description: 'New leads submitted from package pages.',
  },
  {
    label: 'Upload media',
    href: '/admin/collections/media',
    description: 'Images, alt text, captions, and gallery assets.',
  },
]

const workflow = [
  'Create or edit content',
  'Save draft',
  'Preview the public page',
  'Publish changes',
]

export default async function WebflowDashboard({ payload }: ServerProps) {
  const [packages, inquiries, media] = await Promise.all([
    payload.count({
      collection: 'landing-packages',
    }),
    payload.count({
      collection: 'inquiries',
    }),
    payload.count({
      collection: 'media',
    }),
  ])

  return (
    <section className="wf-dashboard">
      <div className="wf-dashboard__topbar">
        <div>
          <p>CMS Workspace</p>
          <h1>iSites Landing CMS</h1>
        </div>
        <div className="wf-dashboard__topbar-actions">
          <a href="/" target="_blank">
            Open live site
          </a>
          <a href="/admin/globals/landing-page">Edit page</a>
        </div>
      </div>

      <div className="wf-dashboard__hero">
        <div>
          <p className="wf-dashboard__eyebrow">Build, edit, publish</p>
          <h2>Manage the landing page like a focused Webflow CMS workspace.</h2>
          <span>
            Use the shortcuts below for page content, CMS collections, assets, and incoming leads.
            The public site reads from the same content records.
          </span>
        </div>
        <div className="wf-dashboard__status">
          <strong>Publishing flow</strong>
          <ol>
            {workflow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="wf-dashboard__metrics" aria-label="CMS totals">
        <div>
          <strong>{packages.totalDocs}</strong>
          <span>Packages</span>
        </div>
        <div>
          <strong>{inquiries.totalDocs}</strong>
          <span>Inquiries</span>
        </div>
        <div>
          <strong>{media.totalDocs}</strong>
          <span>Media assets</span>
        </div>
      </div>

      <div className="wf-dashboard__grid">
        {quickActions.map((action) => (
          <a className="wf-dashboard__card" href={action.href} key={action.href}>
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
