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
    label: 'View contacts',
    href: '/admin/collections/contacts',
    description: 'People created automatically from package inquiries.',
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
  'Qualify incoming leads',
]

const pipelineStages = [
  {
    label: 'New',
    value: 'new',
  },
  {
    label: 'Contacted',
    value: 'contacted',
  },
  {
    label: 'Qualified',
    value: 'qualified',
  },
  {
    label: 'Proposal Sent',
    value: 'proposal_sent',
  },
  {
    label: 'Won',
    value: 'won',
  },
]

export default async function WebflowDashboard({ payload }: ServerProps) {
  const [packages, inquiries, contacts, media, ...pipelineCounts] = await Promise.all([
    payload.count({
      collection: 'landing-packages',
    }),
    payload.count({
      collection: 'inquiries',
    }),
    payload.count({
      collection: 'contacts',
    }),
    payload.count({
      collection: 'media',
    }),
    ...pipelineStages.map((stage) =>
      payload.count({
        collection: 'inquiries',
        where: {
          status: {
            equals: stage.value,
          },
        },
      }),
    ),
  ])
  const pipeline = pipelineStages.map((stage, index) => ({
    ...stage,
    total: pipelineCounts[index]?.totalDocs || 0,
  }))

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
            Draft previews and lead tracking now live inside the same workspace.
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
          <strong>{contacts.totalDocs}</strong>
          <span>Contacts</span>
        </div>
        <div>
          <strong>{media.totalDocs}</strong>
          <span>Media assets</span>
        </div>
      </div>

      <div className="wf-dashboard__pipeline">
        <div>
          <p className="wf-dashboard__eyebrow">Lead pipeline</p>
          <h3>Inquiry follow-up status</h3>
        </div>
        <div className="wf-dashboard__pipeline-list">
          {pipeline.map((stage) => (
            <a
              className="wf-dashboard__pipeline-item"
              href={`/admin/collections/inquiries?where[status][equals]=${stage.value}`}
              key={stage.value}
            >
              <span>{stage.label}</span>
              <strong>{stage.total}</strong>
            </a>
          ))}
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
