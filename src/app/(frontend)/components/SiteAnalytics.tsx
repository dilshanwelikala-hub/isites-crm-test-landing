import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import type { ReactNode } from 'react'

import { trackingEnabled } from '../../../lib/analyticsCollection'
import { createTrackingToken, excludedTrackingRequest } from '../../../lib/analyticsServer'
import { AnalyticsProvider } from './SiteAnalytics.client'

export async function SiteAnalytics({
  siteID = null,
  path,
  preview = false,
  children,
}: {
  siteID?: number | string | null
  path: string
  preview?: boolean
  children: ReactNode
}) {
  let token: string | null = null
  if (!preview) {
    try {
      const requestHeaders = await headers()
      if (!excludedTrackingRequest(requestHeaders)) {
        const payload = await getPayload({ config })
        const { user } = await payload.auth({ headers: requestHeaders })
        const site = siteID === null ? null : Number(siteID)
        if (!user && (await trackingEnabled(payload, site))) {
          token = createTrackingToken(
            site,
            path
              .split('/')
              .map((segment) => encodeURIComponent(segment))
              .join('/'),
          )
        }
      }
    } catch {
      // Analytics availability must never prevent a public page from rendering.
      console.error('Site analytics unavailable for this page.')
    }
  }
  return <AnalyticsProvider token={token}>{children}</AnalyticsProvider>
}
