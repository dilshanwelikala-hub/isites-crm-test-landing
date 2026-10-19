import type { Payload } from 'payload'

import { analyticsActions } from './analytics'
import { trackingEnabled } from './analyticsCollection'
import {
  analyticsVisitor,
  excludedTrackingRequest,
  referrerHostname,
  validVisitorID,
  verifyTrackingToken,
} from './analyticsServer'

const reply = (status: number) =>
  new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })

export async function collectAnalytics(request: Request, payload: Payload) {
  const origin = new URL(request.url).origin
  if (
    request.headers.get('origin') !== origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return reply(403)
  if (excludedTrackingRequest(request.headers)) return reply(204)
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415)

  // Read only a bounded body, including when Content-Length is absent or dishonest.
  const reader = request.body?.getReader()
  if (!reader) return reply(400)
  let size = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > 4096) {
      await reader.cancel()
      return reply(413)
    }
    chunks.push(value)
  }
  let data
  try {
    data = JSON.parse(Buffer.concat(chunks).toString())
  } catch {
    return reply(400)
  }
  if (!data || typeof data !== 'object') return reply(400)
  const claims = verifyTrackingToken(data.token)
  if (
    !claims ||
    !validVisitorID(data.visitor) ||
    !['page_view', 'click'].includes(data.eventType) ||
    (data.eventType === 'click' &&
      (!validVisitorID(data.eventID) ||
        typeof data.action !== 'string' ||
        !Object.hasOwn(analyticsActions, data.action)))
  )
    return reply(400)

  if (!(await trackingEnabled(payload, claims.site))) return reply(204)
  const eventID =
    data.eventType === 'page_view' ? `${claims.nonce}:view` : `${claims.nonce}:${data.eventID}`
  const exists = async () =>
    (
      await payload.count({
        collection: 'analytics-events',
        where: { eventID: { equals: eventID } },
      })
    ).totalDocs > 0
  if (await exists()) return reply(204)
  const count = await payload.count({
    collection: 'analytics-events',
    where: { pageKey: { equals: claims.nonce } },
  })
  if (count.totalDocs >= 100) return reply(429)
  try {
    await payload.create({
      collection: 'analytics-events',
      overrideAccess: true,
      data: {
        eventID,
        pageKey: claims.nonce,
        site: claims.site,
        eventType: data.eventType,
        path: claims.path,
        visitor: analyticsVisitor(data.visitor, claims.site),
        action: data.eventType === 'click' ? data.action : undefined,
        referrer:
          data.eventType === 'page_view' ? referrerHostname(data.referrer, origin) : undefined,
      },
    })
  } catch (error) {
    // Concurrent retries are also protected by the unique eventID database index.
    if (!(await exists())) throw error
  }
  return reply(204)
}
