'use client'

import { Filter } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { analyticsHref } from '../../lib/analytics'

export default function AnalyticsFilters({
  site,
  start,
  end,
  today,
  options,
}: {
  site: string
  start: string
  end: string
  today: string
  options: Array<{ id: number; name: string }>
}) {
  const [selectedSite, setSelectedSite] = useState(site)
  const formRef = useRef<HTMLFormElement>(null)
  const [from, setFrom] = useState(start)
  const [to, setTo] = useState(end)
  useEffect(() => {
    // Back/forward cache can restore unsent form values from a different report.
    const restore = () => {
      formRef.current?.reset()
      setSelectedSite(site)
      setFrom(start)
      setTo(end)
    }
    restore()
    window.addEventListener('pageshow', restore)
    return () => window.removeEventListener('pageshow', restore)
  }, [site, start, end])
  return (
    <form
      ref={formRef}
      autoComplete="off"
      className="site-analytics__filters"
      action="/admin"
      method="get"
    >
      <input type="hidden" name="workspace" value="cms" />
      <input type="hidden" name="view" value="analytics" />
      <label>
        Site
        <select
          name="site"
          value={selectedSite}
          onChange={(event) => setSelectedSite(event.target.value)}
        >
          <option value="default">Default site</option>
          {options.map((option) => (
            <option value={option.id} key={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        From (UTC)
        <input
          name="start"
          type="date"
          required
          value={from}
          max={to}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <label>
        To (UTC)
        <input
          name="end"
          type="date"
          required
          value={to}
          max={today}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
      <button type="submit" aria-label="Apply filters" title="Apply filters">
        <Filter size={18} aria-hidden="true" />
      </button>
      <div className="site-analytics__presets" aria-label="Date range">
        {[7, 30, 90].map((days) => {
          const fromDate = new Date(`${today}T00:00:00Z`)
          fromDate.setUTCDate(fromDate.getUTCDate() - days + 1)
          const date = fromDate.toISOString().slice(0, 10)
          return (
            <a
              key={days}
              href={`${analyticsHref(site === 'default' ? undefined : site)}&start=${date}`}
              aria-current={start === date && end === today ? 'true' : undefined}
            >
              {days} days
            </a>
          )
        })}
      </div>
    </form>
  )
}
