'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { analyticsActions, type AnalyticsAction } from '../../../lib/analytics'
import { firstTouchAttribution, type CampaignAttribution } from '../../../lib/analyticsAttribution'

const AnalyticsContext = createContext<
  (() => { token: string; visitor: string; attribution: CampaignAttribution } | undefined) | null
>(null)
export const useInquiryAnalytics = () => useContext(AnalyticsContext)

function trackingAllowed() {
  return (
    navigator.doNotTrack !== '1' &&
    !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl &&
    !new URLSearchParams(window.location.search).has('preview') &&
    !new URLSearchParams(window.location.search).has('previewToken')
  )
}

export function AnalyticsProvider({
  token,
  siteKey,
  children,
}: {
  token: string | null
  siteKey: string
  children: ReactNode
}) {
  const visitorRef = useRef<string | null>(null)
  const attributionRef = useRef<{
    siteKey: string
    visitor: string
    attribution: CampaignAttribution
  } | null>(null)
  const context = () => {
    if (!token || !trackingAllowed()) return undefined
    if (!visitorRef.current) {
      try {
        const key = 'isites-analytics-session'
        visitorRef.current = sessionStorage.getItem(key) || crypto.randomUUID()
        sessionStorage.setItem(key, visitorRef.current)
      } catch {
        return undefined
      }
    }
    const visitor = visitorRef.current
    if (attributionRef.current?.siteKey !== siteKey || attributionRef.current.visitor !== visitor) {
      const key = `isites-analytics-attribution-${siteKey}`
      let saved: unknown
      try {
        const stored = sessionStorage.getItem(key)
        if (stored && stored.length <= 2048) saved = JSON.parse(stored)
      } catch {
        /* Discard malformed or unavailable storage. */
      }
      const attribution = firstTouchAttribution(
        saved,
        visitor,
        window.location.search,
        document.referrer,
        window.location.origin,
      )
      attributionRef.current = { siteKey, visitor, attribution }
      try {
        sessionStorage.setItem(key, JSON.stringify({ visitor, attribution }))
      } catch {
        /* Keep the current page usable when storage is full. */
      }
    }
    return { token, visitor, attribution: attributionRef.current.attribution }
  }

  useEffect(() => {
    const identity = context()
    if (!identity) return
    let referrer: string | undefined
    try {
      referrer = new URL(document.referrer).origin
    } catch {
      /* Empty or unavailable referrer. */
    }
    const send = (
      eventType: 'page_view' | 'click',
      action?: AnalyticsAction,
      packageSlug?: string,
    ) => {
      if (!trackingAllowed()) return
      void fetch('/api/analytics', {
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...identity,
          eventID: crypto.randomUUID(),
          eventType,
          action,
          packageSlug,
          referrer,
        }),
      }).catch(() => {})
    }
    send('page_view')
    let clicks = 0
    const onClick = (event: MouseEvent) => {
      if (!event.isTrusted || clicks >= 99 || !(event.target instanceof Element)) return
      const target = event.target.closest<HTMLElement>(
        '[data-analytics-event], a[href^="tel:"], a[href^="mailto:"]',
      )
      if (!target) return
      const action =
        target.dataset.analyticsEvent ||
        (target.getAttribute('href')?.startsWith('tel:') ? 'phone' : 'email')
      if (Object.hasOwn(analyticsActions, action)) {
        clicks++
        send('click', action as AnalyticsAction, target.dataset.analyticsPackage)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [token, siteKey])

  return <AnalyticsContext.Provider value={context}>{children}</AnalyticsContext.Provider>
}
