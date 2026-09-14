import type { ServerProps, Where } from 'payload'

import { getTemplateLabel, siteTemplates, type SiteTemplate } from '../../lib/siteTemplates'

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
  status?: string | null
}

type SiteCard = {
  id: number | string
  name?: string | null
  primaryDomain?: string | null
  slug?: string | null
  siteStatus?: string | null
  template?: string | null
  updatedAt?: string | null
}

type MediaCard = {
  alt?: string | null
  filesize?: number | null
  filename?: string | null
  id: number | string
  mimeType?: string | null
  usage?: string | null
}

type SiteWorkspace = SiteCard & {
  contactCount: number
  dueCount: number
  leadCount: number
  mediaCount: number
  packageCount: number
  pipeline: Array<{
    label: string
    total: number
    value: string
  }>
  recentLeads: LeadCard[]
  wonCount: number
}

type TemplateWorkspace = SiteTemplate & {
  liveSiteCount: number
  siteCount: number
}

const quickActions = [
  {
    label: 'Create site',
    href: '/admin/collections/sites/create',
    description: 'Add a client website using the current landing template.',
  },
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

const activeLeadWhere: Where = {
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

function formatFileSize(value?: number | null) {
  if (!value) {
    return 'Size unavailable'
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
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

function statusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    contacted: 'Contacted',
    closed: 'Closed',
    lost: 'Lost',
    new: 'New',
    proposal_sent: 'Proposal sent',
    qualified: 'Qualified',
    won: 'Won',
  }

  return value ? labels[value] || value : 'New'
}

function siteStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    archived: 'Archived',
    draft: 'Draft',
    live: 'Live',
  }

  return value ? labels[value] || value : 'Live'
}

function sitePath(site: SiteCard) {
  return site.slug ? `/sites/${site.slug}` : '/'
}

function siteWhere(siteID: number | string): Where {
  return {
    site: {
      equals: siteID,
    },
  }
}

function filteredCollectionHref(collection: string, siteID: number | string) {
  return `/admin/collections/${collection}?where%5Bsite%5D%5Bequals%5D=${encodeURIComponent(String(siteID))}`
}

function templateHref(templateKey: string) {
  return `/admin/collections/sites?where%5Btemplate%5D%5Bequals%5D=${encodeURIComponent(templateKey)}`
}

async function getTemplateWorkspace({
  payload,
  template,
}: {
  payload: ServerProps['payload']
  template: SiteTemplate
}): Promise<TemplateWorkspace> {
  const templateWhere: Where = {
    template: {
      equals: template.key,
    },
  }
  const [siteCount, liveSiteCount] = await Promise.all([
    payload.count({
      collection: 'sites',
      where: templateWhere,
    }),
    payload.count({
      collection: 'sites',
      where: {
        and: [
          templateWhere,
          {
            or: [
              {
                siteStatus: {
                  equals: 'live',
                },
              },
              {
                siteStatus: {
                  exists: false,
                },
              },
            ],
          },
        ],
      },
    }),
  ])

  return {
    ...template,
    liveSiteCount: liveSiteCount.totalDocs || 0,
    siteCount: siteCount.totalDocs || 0,
  }
}

async function getSiteWorkspace({
  now,
  payload,
  site,
}: {
  now: string
  payload: ServerProps['payload']
  site: SiteCard
}): Promise<SiteWorkspace> {
  const scopedWhere = siteWhere(site.id)
  const [
    packageCount,
    leadCount,
    contactCount,
    mediaCount,
    dueCount,
    wonCount,
    recentLeads,
    pipelineCounts,
  ] = await Promise.all([
    payload.count({
      collection: 'landing-packages',
      where: scopedWhere,
    }),
    payload.count({
      collection: 'inquiries',
      where: scopedWhere,
    }),
    payload.count({
      collection: 'contacts',
      where: scopedWhere,
    }),
    payload.count({
      collection: 'media',
      where: scopedWhere,
    }),
    payload.count({
      collection: 'inquiries',
      where: {
        and: [
          scopedWhere,
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
          scopedWhere,
          {
            status: {
              equals: 'won',
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'inquiries',
      depth: 0,
      limit: 3,
      sort: '-createdAt',
      where: scopedWhere,
    }),
    Promise.all(
      pipelineStages.map((stage) =>
        payload.count({
          collection: 'inquiries',
          where: {
            and: [
              scopedWhere,
              {
                status: {
                  equals: stage.value,
                },
              },
            ],
          },
        }),
      ),
    ),
  ])

  return {
    ...site,
    contactCount: contactCount.totalDocs || 0,
    dueCount: dueCount.totalDocs || 0,
    leadCount: leadCount.totalDocs || 0,
    mediaCount: mediaCount.totalDocs || 0,
    packageCount: packageCount.totalDocs || 0,
    pipeline: pipelineStages.map((stage, index) => ({
      label: stage.label,
      total: pipelineCounts[index]?.totalDocs || 0,
      value: stage.value,
    })),
    recentLeads: recentLeads.docs as LeadCard[],
    wonCount: wonCount.totalDocs || 0,
  }
}

export default async function WebflowDashboard({ payload }: ServerProps) {
  const now = new Date().toISOString()
  const blobStorageEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN)
  const storageStatus = blobStorageEnabled ? 'Vercel Blob connected' : 'Local upload fallback'
  const storageHint = blobStorageEnabled
    ? 'Uploads are stored in persistent cloud storage.'
    : 'Connect Vercel Blob before using uploads in production.'
  const dueFollowUpHref = `/admin/collections/inquiries?where%5BfollowUpAt%5D%5Bless_than_equal%5D=${encodeURIComponent(
    now,
  )}`
  const [
    sites,
    liveSites,
    packages,
    inquiries,
    contacts,
    media,
    unassignedMedia,
    recentMedia,
    followUpsDue,
    highPriority,
    recentInquiries,
    recentSites,
  ] = await Promise.all([
      payload.count({
        collection: 'sites',
      }),
      payload.count({
        collection: 'sites',
        where: {
          or: [
            {
              siteStatus: {
                equals: 'live',
              },
            },
            {
              siteStatus: {
                exists: false,
              },
            },
          ],
        },
      }),
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
        collection: 'media',
        where: {
          site: {
            exists: false,
          },
        },
      }),
      payload.find({
        collection: 'media',
        depth: 0,
        limit: 4,
        sort: '-updatedAt',
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
      payload.find({
        collection: 'sites',
        depth: 0,
        limit: 6,
        sort: '-updatedAt',
      }),
    ])

  const [pipelineCounts, pipelineLeadResults, siteWorkspaces, templateWorkspaces] = await Promise.all([
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
    Promise.all(
      (recentSites.docs as SiteCard[]).map((site) =>
        getSiteWorkspace({
          now,
          payload,
          site,
        }),
      ),
    ),
    Promise.all(siteTemplates.map((template) => getTemplateWorkspace({ payload, template }))),
  ])

  const pipeline = pipelineStages.map((stage, index) => ({
    ...stage,
    leads: pipelineLeadResults[index]?.docs as LeadCard[],
    total: pipelineCounts[index]?.totalDocs || 0,
  }))
  const recentLeads = recentInquiries.docs as LeadCard[]
  const recentAssets = recentMedia.docs as MediaCard[]

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
          <strong>{sites.totalDocs}</strong>
          <span>Total sites</span>
        </div>
        <div>
          <strong>{liveSites.totalDocs}</strong>
          <span>Live sites</span>
        </div>
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

      <div className="wf-dashboard__media">
        <header className="wf-dashboard__section-header">
          <div>
            <p className="wf-dashboard__eyebrow">Media</p>
            <h3>Asset readiness</h3>
          </div>
          <a href="/admin/collections/media/create">Upload image</a>
        </header>
        <div className="wf-dashboard__media-layout">
          <div className="wf-dashboard__media-status">
            <strong>{storageStatus}</strong>
            <span>{storageHint}</span>
            <div>
              <a href="/admin/collections/media">View media</a>
              <a href="/admin/collections/media/create">Add image</a>
            </div>
          </div>
          <div className="wf-dashboard__media-metrics">
            <a href="/admin/collections/media">
              <strong>{media.totalDocs}</strong>
              <span>Total assets</span>
            </a>
            <a href="/admin/collections/media?where%5Bsite%5D%5Bexists%5D=false">
              <strong>{unassignedMedia.totalDocs}</strong>
              <span>Unassigned</span>
            </a>
          </div>
          <div className="wf-dashboard__media-recent">
            <strong>Recent assets</strong>
            {recentAssets.length ? (
              <div>
                {recentAssets.map((asset) => (
                  <a href={`/admin/collections/media/${asset.id}`} key={asset.id}>
                    <span>{asset.alt || asset.filename || 'Untitled image'}</span>
                    <small>
                      {asset.usage || asset.mimeType || 'Image'} - {formatFileSize(asset.filesize)}
                    </small>
                  </a>
                ))}
              </div>
            ) : (
              <p>No media uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="wf-dashboard__templates">
        <header className="wf-dashboard__section-header">
          <div>
            <p className="wf-dashboard__eyebrow">Templates</p>
            <h3>Client site starters</h3>
          </div>
          <a href="/admin/collections/sites/create">Create site</a>
        </header>
        <div className="wf-dashboard__template-grid">
          {templateWorkspaces.map((template) => (
            <article className="wf-dashboard__template-card" key={template.key}>
              <header>
                <span style={{ background: template.theme.accentColor }} />
                <div>
                  <strong>{template.label}</strong>
                  <small>{template.summary}</small>
                </div>
              </header>
              <p>{template.bestFor}</p>
              <div>
                <span>{template.siteCount} sites</span>
                <span>{template.liveSiteCount} live</span>
              </div>
              <footer>
                <a href={`/admin/collections/sites/create?template=${template.key}`}>Start site</a>
                <a href={templateHref(template.key)}>View sites</a>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <div className="wf-dashboard__sites">
        <header className="wf-dashboard__section-header">
          <div>
            <p className="wf-dashboard__eyebrow">Site CRM</p>
            <h3>Site-based workspaces</h3>
          </div>
          <a href="/admin/collections/sites/create">Create site</a>
        </header>
        {siteWorkspaces.length ? (
          <div className="wf-dashboard__site-workspaces">
            {siteWorkspaces.map((site) => (
              <article className="wf-dashboard__site-workspace" key={site.id}>
                <header>
                  <div>
                    <strong>{site.name || site.slug || 'Untitled site'}</strong>
                    <span>{site.primaryDomain || sitePath(site)}</span>
                  </div>
                  <em>{siteStatusLabel(site.siteStatus)}</em>
                </header>

                <div className="wf-dashboard__site-meta">
                  <span>{getTemplateLabel(site.template)}</span>
                  <span>{site.dueCount} due</span>
                  <span>{site.wonCount} won</span>
                </div>

                <div className="wf-dashboard__site-stats" aria-label={`${site.name || site.slug} totals`}>
                  <a href={filteredCollectionHref('landing-packages', site.id)}>
                    <strong>{site.packageCount}</strong>
                    <span>Packages</span>
                  </a>
                  <a href={filteredCollectionHref('inquiries', site.id)}>
                    <strong>{site.leadCount}</strong>
                    <span>Leads</span>
                  </a>
                  <a href={filteredCollectionHref('contacts', site.id)}>
                    <strong>{site.contactCount}</strong>
                    <span>Contacts</span>
                  </a>
                  <a href={filteredCollectionHref('media', site.id)}>
                    <strong>{site.mediaCount}</strong>
                    <span>Media</span>
                  </a>
                </div>

                <div className="wf-dashboard__site-pipeline">
                  {site.pipeline.map((stage) => (
                    <a
                      href={`/admin/collections/inquiries?where%5Band%5D%5B0%5D%5Bsite%5D%5Bequals%5D=${encodeURIComponent(
                        String(site.id),
                      )}&where%5Band%5D%5B1%5D%5Bstatus%5D%5Bequals%5D=${stage.value}`}
                      key={stage.value}
                    >
                      <span>{stage.label}</span>
                      <strong>{stage.total}</strong>
                    </a>
                  ))}
                </div>

                <div className="wf-dashboard__site-leads">
                  <strong>Recent leads</strong>
                  {site.recentLeads.length ? (
                    <div>
                      {site.recentLeads.map((lead) => (
                        <a href={`/admin/collections/inquiries/${lead.id}`} key={lead.id}>
                          <span>{lead.name || lead.email || 'Unnamed lead'}</span>
                          <small>
                            {statusLabel(lead.status)} - {nextStepLabel(lead.nextStep)}
                          </small>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p>No leads for this site yet.</p>
                  )}
                </div>

                <footer>
                  <a href={`/admin/collections/sites/${site.id}`}>Edit site</a>
                  {site.slug ? (
                    <a href={sitePath(site)} target="_blank">
                      Open site
                    </a>
                  ) : null}
                  <a href={filteredCollectionHref('inquiries', site.id)}>View leads</a>
                  <a href={filteredCollectionHref('landing-packages', site.id)}>View packages</a>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="wf-dashboard__empty-panel">
            <strong>No sites created yet.</strong>
            <span>Create the first client site, then assign packages and leads to it.</span>
            <a href="/admin/collections/sites/create">Create site</a>
          </div>
        )}
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
