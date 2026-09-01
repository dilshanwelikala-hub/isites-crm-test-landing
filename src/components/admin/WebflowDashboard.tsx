import type { ServerProps } from 'payload'

type LeadCard = {
  createdAt?: string | null
  email?: string | null
  estimatedValue?: number | null
  followUpAt?: string | null
  id: number | string
  name?: string | null
  nextStep?: string | null
  packageTitle?: string | null
  priority?: string | null
}

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
    hint: 'Fresh leads to review',
    value: 'new',
  },
  {
    label: 'Contacted',
    hint: 'Initial reply sent',
    value: 'contacted',
  },
  {
    label: 'Qualified',
    hint: 'Good-fit opportunities',
    value: 'qualified',
  },
  {
    label: 'Proposal Sent',
    hint: 'Waiting on a decision',
    value: 'proposal_sent',
  },
  {
    label: 'Won',
    hint: 'Converted bookings',
    value: 'won',
  },
]

const activeLeadWhere = {
  status: {
    not_in: ['won', 'lost', 'closed'],
  },
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'No follow-up'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No follow-up'
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function formatValue(value?: number | null) {
  if (!value) {
    return null
  }

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function nextStepLabel(value?: string | null) {
  const labels: Record<string, string> = {
    reply_to_lead: 'Reply to lead',
    send_package_details: 'Send details',
    prepare_proposal: 'Prepare proposal',
    waiting_for_response: 'Waiting',
    no_action_needed: 'No action',
  }

  return value ? labels[value] || value : 'Reply to lead'
}

export default async function WebflowDashboard({ payload }: ServerProps) {
  const now = new Date().toISOString()
  const dueFollowUpHref = `/admin/collections/inquiries?where%5BfollowUpAt%5D%5Bless_than_equal%5D=${encodeURIComponent(
    now,
  )}`
  const [packages, inquiries, contacts, media, followUpsDue, highPriority, recentInquiries] =
    await Promise.all([
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
      payload.count({
        collection: 'inquiries',
        where: {
          and: [
            activeLeadWhere,
            {
              followUpAt: {
                less_than_equal: now,
              },
            },
          ],
        },
      }),
      payload.count({
        collection: 'inquiries',
        where: {
          and: [
            activeLeadWhere,
            {
              priority: {
                equals: 'high',
              },
            },
          ],
        },
      }),
      payload.find({
        collection: 'inquiries',
        depth: 0,
        limit: 5,
        sort: '-createdAt',
      }),
    ])

  const [pipelineCounts, pipelineLeadResults] = await Promise.all([
    Promise.all(
      pipelineStages.map((stage) =>
        payload.count({
          collection: 'inquiries',
          where: {
            status: {
              equals: stage.value,
            },
          },
        }),
      ),
    ),
    Promise.all(
      pipelineStages.map((stage) =>
        payload.find({
          collection: 'inquiries',
          depth: 0,
          limit: 3,
          sort: '-createdAt',
          where: {
            status: {
              equals: stage.value,
            },
          },
        }),
      ),
    ),
  ])

  const pipeline = pipelineStages.map((stage, index) => ({
    ...stage,
    leads: pipelineLeadResults[index]?.docs as LeadCard[],
    total: pipelineCounts[index]?.totalDocs || 0,
  }))
  const recentLeads = recentInquiries.docs as LeadCard[]

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
          <h2>Manage content and leads in one focused Webflow-style workspace.</h2>
          <span>
            Editors can publish landing content, preview drafts, review incoming inquiries, and move
            qualified leads through a lightweight sales workflow.
          </span>
        </div>
        <div className="wf-dashboard__status">
          <strong>Working flow</strong>
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

      <div className="wf-dashboard__focus-grid">
        <a className="wf-dashboard__focus-card" href={dueFollowUpHref}>
          <span>Needs attention</span>
          <strong>{followUpsDue.totalDocs}</strong>
          <small>Follow-ups due today or earlier</small>
        </a>
        <a
          className="wf-dashboard__focus-card"
          href="/admin/collections/inquiries?where%5Bpriority%5D%5Bequals%5D=high"
        >
          <span>High priority</span>
          <strong>{highPriority.totalDocs}</strong>
          <small>Active leads marked as important</small>
        </a>
        <div className="wf-dashboard__recent">
          <span>Recent leads</span>
          {recentLeads.length ? (
            <div>
              {recentLeads.map((lead) => (
                <a href={`/admin/collections/inquiries/${lead.id}`} key={lead.id}>
                  <strong>{lead.name || lead.email || 'Unnamed lead'}</strong>
                  <small>{lead.packageTitle || nextStepLabel(lead.nextStep)}</small>
                </a>
              ))}
            </div>
          ) : (
            <p>No leads yet.</p>
          )}
        </div>
      </div>

      <div className="wf-dashboard__pipeline">
        <div>
          <p className="wf-dashboard__eyebrow">Lead pipeline</p>
          <h3>Inquiry follow-up board</h3>
        </div>
        <div className="wf-dashboard__board">
          {pipeline.map((stage) => (
            <section className="wf-dashboard__column" key={stage.value}>
              <header>
                <div>
                  <strong>{stage.label}</strong>
                  <span>{stage.hint}</span>
                </div>
                <em>{stage.total}</em>
              </header>

              {stage.leads.length ? (
                <div className="wf-dashboard__lead-list">
                  {stage.leads.map((lead) => {
                    const value = formatValue(lead.estimatedValue)

                    return (
                      <a
                        className="wf-dashboard__lead-card"
                        href={`/admin/collections/inquiries/${lead.id}`}
                        key={lead.id}
                      >
                        <strong>{lead.name || lead.email || 'Unnamed lead'}</strong>
                        <span>{lead.packageTitle || 'General inquiry'}</span>
                        <small>{nextStepLabel(lead.nextStep)}</small>
                        <footer>
                          <span>{formatDate(lead.followUpAt)}</span>
                          {value ? <span>{value}</span> : null}
                          {lead.priority ? <span>{lead.priority}</span> : null}
                        </footer>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="wf-dashboard__empty">No leads in this stage.</p>
              )}

              <a
                className="wf-dashboard__view-stage"
                href={`/admin/collections/inquiries?where%5Bstatus%5D%5Bequals%5D=${stage.value}`}
              >
                View stage
              </a>
            </section>
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
