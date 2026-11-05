'use client'

import { Check, Copy, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { campaignURL } from '../../lib/analyticsAttribution'

export default function CampaignLinkBuilder({ baseURL }: { baseURL: string }) {
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState(baseURL)
  const [medium, setMedium] = useState('')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const url = campaignURL(baseURL, destination, source, medium, campaign)
  const change = (setter: (value: string) => void, value: string) => {
    setter(value)
    setCopied(false)
    setError('')
  }
  return (
    <details className="site-analytics__link-builder">
      <summary>
        <LinkIcon size={16} aria-hidden="true" />
        Campaign link
      </summary>
      <div className="site-analytics__link-fields">
        <label className="site-analytics__generated-link">
          Destination URL
          <input
            type="url"
            value={destination}
            onChange={(event) => change(setDestination, event.target.value)}
          />
        </label>
        <label>
          Source
          <input
            maxLength={80}
            value={source}
            onChange={(event) => change(setSource, event.target.value)}
          />
        </label>
        <label>
          Medium
          <input
            maxLength={80}
            value={medium}
            onChange={(event) => change(setMedium, event.target.value)}
          />
        </label>
        <label>
          Campaign
          <input
            maxLength={80}
            value={campaign}
            onChange={(event) => change(setCampaign, event.target.value)}
          />
        </label>
        <label className="site-analytics__generated-link">
          Campaign URL
          <input readOnly value={url} />
        </label>
        <button
          type="button"
          disabled={!url}
          title={copied ? 'Copied' : 'Copy campaign URL'}
          aria-label={copied ? 'Copied' : 'Copy campaign URL'}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url)
              setCopied(true)
              setError('')
            } catch {
              setError('Clipboard unavailable.')
            }
          }}
        >
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        </button>
        <span role="status">{error || (copied ? 'Copied' : '')}</span>
      </div>
    </details>
  )
}
