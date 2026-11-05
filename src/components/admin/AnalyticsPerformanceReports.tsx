import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { analyticsHref, type analyticsRange } from '../../lib/analytics'
import type { AnalyticsTab } from '../../lib/analyticsAttribution'
import type { summarizePerformance } from '../../lib/analyticsPerformance'
import CampaignLinkBuilder from './CampaignLinkBuilder.client'

export default function AnalyticsPerformanceReports({
  report,
  tab,
  baseURL,
  siteID,
  range,
  page,
}: {
  report: ReturnType<typeof summarizePerformance>
  tab: AnalyticsTab
  baseURL: string
  siteID?: string | number
  range: ReturnType<typeof analyticsRange>
  page: unknown
}) {
  const allRows = tab === 'packages' ? report.packages : report.campaigns
  const totalPages = Math.max(1, Math.ceil(allRows.length / 25))
  const current =
    typeof page === 'string' && /^[1-9]\d*$/.test(page) ? Math.min(totalPages, Number(page)) : 1
  const href = (next: number) =>
    `${analyticsHref(siteID)}&tab=${tab}&start=${range.start}&end=${range.end}&page=${next}`
  const sourceCells = (row: (typeof report.campaigns)[number]) => (
    <>
      <td>{row.source}</td>
      <td>{row.medium}</td>
      <td>{row.campaign}</td>
    </>
  )
  const headers =
    tab === 'packages'
      ? ['Package', 'Detail views', 'Visitors', 'Clicks', 'Inquiries', 'Visitor conversion', 'Won']
      : tab === 'outcomes'
        ? ['Source', 'Medium', 'Campaign', 'Inquiries', 'Qualified', 'Proposals', 'Won', 'Won rate']
        : [
            'Source',
            'Medium',
            'Campaign',
            'Views',
            'Visitors',
            'Clicks',
            'Inquiries',
            'Visitor conversion',
          ]
  let rows: ReactNode[]
  if (tab === 'packages')
    rows = report.packages.slice((current - 1) * 25, current * 25).map((row) => (
      <tr key={row.slug}>
        <td>
          <strong>{row.title}</strong>
          <small>{row.slug}</small>
        </td>
        <td>{row.views}</td>
        <td>{row.visitors}</td>
        <td>{row.clicks}</td>
        <td>{row.inquiries}</td>
        <td>{row.conversion.toFixed(1)}%</td>
        <td>{row.won}</td>
      </tr>
    ))
  else
    rows = report.campaigns.slice((current - 1) * 25, current * 25).map((row) => (
      <tr key={row.key}>
        {sourceCells(row)}
        {tab === 'outcomes' ? (
          <>
            <td>{row.inquiries}</td>
            <td>{row.qualified}</td>
            <td>{row.proposals}</td>
            <td>{row.won}</td>
            <td>{row.wonRate.toFixed(1)}%</td>
          </>
        ) : (
          <>
            <td>{row.views}</td>
            <td>{row.visitors}</td>
            <td>{row.clicks}</td>
            <td>{row.inquiries}</td>
            <td>{row.conversion.toFixed(1)}%</td>
          </>
        )}
      </tr>
    ))
  return (
    <section className="site-analytics__performance">
      {tab === 'campaigns' ? <CampaignLinkBuilder key={baseURL} baseURL={baseURL} /> : null}
      {tab === 'outcomes' ? (
        <div
          className="site-analytics__outcomes"
          aria-label="Current inquiry status"
          title="Current status of tracked inquiries created in the selected date range, not historical stage transitions or confirmed bookings."
        >
          {report.outcomes
            .filter((row) => row.status !== 'unknown' || row.count > 0)
            .map((row) => (
              <div key={row.status}>
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
          <div>
            <span>Won rate</span>
            <strong>{report.wonRate.toFixed(1)}%</strong>
          </div>
        </div>
      ) : null}
      <h2>
        {tab === 'packages'
          ? 'Package performance'
          : tab === 'outcomes'
            ? 'Lead outcomes by acquisition source'
            : 'Campaign performance'}
      </h2>
      {rows.length ? (
        <>
          <div
            className="site-analytics__table-scroll"
            role="region"
            aria-label={`${tab} report`}
            tabIndex={0}
          >
            <table
              className={`site-analytics__performance-table site-analytics__performance-table--${tab}`}
            >
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      title={
                        header === 'Qualified' || header === 'Proposals' || header === 'Won'
                          ? 'Current CRM stage, not cumulative stage history.'
                          : header === 'Visitor conversion'
                            ? 'Sessions with both a detail/page view and an inquiry in this period, divided by measured visitor sessions.'
                            : undefined
                      }
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
          <nav className="site-analytics__pagination" aria-label="Report pagination">
            <span>
              {allRows.length}{' '}
              {tab === 'packages'
                ? allRows.length === 1
                  ? 'package'
                  : 'packages'
                : allRows.length === 1
                  ? 'group'
                  : 'groups'}
            </span>
            {current > 1 ? (
              <a href={href(current - 1)} aria-label="Previous page" title="Previous page">
                <ChevronLeft size={18} aria-hidden="true" />
              </a>
            ) : null}
            <span>
              {current} / {totalPages}
            </span>
            {current < totalPages ? (
              <a href={href(current + 1)} aria-label="Next page" title="Next page">
                <ChevronRight size={18} aria-hidden="true" />
              </a>
            ) : null}
          </nav>
        </>
      ) : (
        <p className="site-analytics__empty">No tracked activity in this period.</p>
      )}
    </section>
  )
}
