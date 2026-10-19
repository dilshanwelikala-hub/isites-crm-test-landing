import { ArrowLeft, BarChart3, ExternalLink } from 'lucide-react'
import type { Payload, ServerProps, Where } from 'payload'

import {
  analyticsActions,
  analyticsHref,
  analyticsRange,
  summarizeAnalytics,
  type AnalyticsEvent,
  type AnalyticsInquiry,
} from '../../lib/analytics'
import { trackingEnabled } from '../../lib/analyticsCollection'
import AnalyticsFilters from './AnalyticsFilters.client'

type ReportProps = Pick<ServerProps, 'payload' | 'user' | 'permissions' | 'searchParams'>

async function reportRows(
  payload: Payload,
  collection: 'analytics-events' | 'inquiries',
  where: Where,
  user: ServerProps['user'],
) {
  const rows: Array<AnalyticsEvent | AnalyticsInquiry> = []
  for (let page = 1; page <= 50; page++) {
    const result = await payload.find({
      collection,
      depth: 0,
      limit: 1000,
      page,
      sort: 'id',
      where,
      select:
        collection === 'analytics-events'
          ? {
              eventType: true,
              visitor: true,
              path: true,
              action: true,
              referrer: true,
              createdAt: true,
            }
          : { analyticsVisitor: true, createdAt: true },
      overrideAccess: false,
      user,
    })
    if (result.totalDocs > 50000) throw new Error('REPORT_TOO_LARGE')
    rows.push(...(result.docs as unknown as Array<AnalyticsEvent | AnalyticsInquiry>))
    if (!result.hasNextPage) break
  }
  return rows
}

function Ranking({
  title,
  rows,
  labels,
}: {
  title: string
  rows: Array<{ label: string; count: number }>
  labels?: Record<string, string>
}) {
  return (
    <section className="site-analytics__ranking">
      <h2>{title}</h2>
      {rows.length ? (
        <table>
          <thead>
            <tr>
              <th scope="col">
                {title === 'Top pages' ? 'Page' : title === 'Button clicks' ? 'Button' : 'Source'}
              </th>
              <th scope="col">{title === 'Button clicks' ? 'Clicks' : 'Views'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.label}>
                <td>{labels?.[row.label] || row.label}</td>
                <td>{row.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="site-analytics__empty">No activity in this period.</p>
      )}
    </section>
  )
}

async function Report({ payload, user, permissions, searchParams }: ReportProps) {
  if (
    !user ||
    !permissions?.collections?.['analytics-events']?.read ||
    !permissions?.collections?.inquiries?.read
  ) {
    return <p role="alert">You do not have access to site analytics.</p>
  }
  const selection = searchParams?.site ?? 'default'
  if (
    selection !== 'default' &&
    (typeof selection !== 'string' ||
      !/^[1-9]\d*$/.test(selection) ||
      !Number.isSafeInteger(Number(selection)))
  ) {
    return <p role="alert">Site not found.</p>
  }
  const siteID = selection === 'default' ? null : Number(selection)
  const range = analyticsRange(searchParams?.start, searchParams?.end)
  const site =
    siteID === null
      ? null
      : await payload.findByID({
          collection: 'sites',
          id: siteID,
          depth: 0,
          draft: true,
          overrideAccess: false,
          user,
        })
  const sites = await payload.find({
    collection: 'sites',
    depth: 0,
    limit: 200,
    sort: 'name',
    select: { name: true },
    overrideAccess: false,
    user,
  })
  const options = [...sites.docs]
  if (site && !options.some((option) => option.id === site.id)) options.push(site)
  const enabled = await trackingEnabled(payload, siteID)
  const scope: Where = siteID === null ? { site: { exists: false } } : { site: { equals: siteID } }
  const date: Where = {
    createdAt: {
      greater_than_equal: range.from,
      less_than: range.until < new Date().toISOString() ? range.until : new Date().toISOString(),
    },
  }
  const [events, inquiries] = await Promise.all([
    reportRows(payload, 'analytics-events', { and: [scope, date] }, user),
    reportRows(
      payload,
      'inquiries',
      { and: [scope, date, { analyticsVisitor: { exists: true } }] },
      user,
    ),
  ])
  const summary = summarizeAnalytics(
    events as AnalyticsEvent[],
    inquiries as AnalyticsInquiry[],
    range,
  )
  const maximum = Math.max(1, ...summary.days.map((day) => Math.max(day.views, day.inquiries)))
  const settingsURL = site ? `/admin/collections/sites/${site.id}` : '/admin/globals/landing-page'

  return (
    <section className="site-analytics">
      <header className="site-analytics__header">
        <div>
          <a className="site-analytics__back" href="/admin?workspace=cms">
            <ArrowLeft size={16} aria-hidden="true" />
            CMS Workspace
          </a>
          <h1>
            <BarChart3 size={24} aria-hidden="true" />
            Site Analytics
          </h1>
          <p>
            {site?.name || 'Default site'}{' '}
            <span className="site-analytics__status">
              {enabled ? 'Tracking enabled' : 'Tracking disabled'}
            </span>
          </p>
        </div>
        <div className="site-analytics__links">
          <a href={settingsURL}>Site settings</a>
          <a href={site ? `/sites/${site.slug}` : '/'} target="_blank" rel="noreferrer">
            Open site
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </header>
      <AnalyticsFilters
        key={`${selection}-${range.start}-${range.end}`}
        site={String(selection)}
        start={range.start}
        end={range.end}
        today={new Date().toISOString().slice(0, 10)}
        options={options.map((option) => ({ id: option.id, name: option.name }))}
      />
      <div className="site-analytics__metrics">
        {[
          { label: 'Page views', value: summary.views.toLocaleString() },
          {
            label: 'Estimated visitors',
            value: summary.visitors.toLocaleString(),
            title:
              'Distinct browser-tab sessions, not people. Resets when the tab session ends. Blocked tracking is not counted.',
          },
          { label: 'Button clicks', value: summary.clicks.toLocaleString() },
          {
            label: 'Website inquiries',
            value: summary.inquiries.toLocaleString(),
            title: 'Successfully saved website inquiries with verified analytics attribution.',
          },
          {
            label: 'Visitor conversion',
            value: `${summary.conversion.toFixed(1)}%`,
            title:
              'Tracked visitor sessions with at least one inquiry divided by sessions with a page view in this period.',
          },
        ].map((metric) => (
          <div key={metric.label} title={metric.title}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <section className="site-analytics__trend">
        <header>
          <h2>Daily activity</h2>
          <div className="site-analytics__legend">
            <span>Page views</span>
            <span>Inquiries</span>
          </div>
        </header>
        {summary.views || summary.inquiries ? (
          <div
            className="site-analytics__chart"
            role="group"
            aria-label={`Daily page views and inquiries from ${range.start} to ${range.end}, UTC`}
          >
            {summary.days.map((day) => (
              <div
                className="site-analytics__day"
                key={day.date}
                tabIndex={0}
                title={`${day.date}: ${day.views} views, ${day.inquiries} inquiries`}
                aria-label={`${day.date}: ${day.views} views, ${day.inquiries} inquiries`}
              >
                <div className="site-analytics__bars">
                  <i style={{ height: `${(day.views / maximum) * 100}%` }} />
                  <i style={{ height: `${(day.inquiries / maximum) * 100}%` }} />
                </div>
                <span>{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="site-analytics__empty">No tracked activity in this period.</p>
        )}
      </section>
      <div className="site-analytics__rankings">
        <Ranking title="Top pages" rows={summary.pages} />
        <Ranking title="Button clicks" rows={summary.actions} labels={analyticsActions} />
        <Ranking title="Referrers" rows={summary.sources} />
      </div>
    </section>
  )
}

export default async function AnalyticsDashboard(props: ReportProps) {
  try {
    return await Report(props)
  } catch (error) {
    props.payload.logger.error({ msg: 'Unable to load site analytics.', err: error })
    return (
      <section className="site-analytics">
        <h1>Site Analytics</h1>
        <p role="alert">
          {error instanceof Error && error.message === 'REPORT_TOO_LARGE'
            ? 'This report exceeds 50,000 records. Select a shorter date range.'
            : 'Analytics could not be loaded. Please try again.'}
        </p>
        <a href={analyticsHref()}>Reset filters</a>
      </section>
    )
  }
}
