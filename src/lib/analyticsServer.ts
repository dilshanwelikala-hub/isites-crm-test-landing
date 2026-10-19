import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

export type TrackingClaims = { site: number | null; path: string; nonce: string; expires: number }

function secret() {
  return (
    process.env.PAYLOAD_SECRET ||
    (process.env.NODE_ENV !== 'production' ? 'local-development-secret' : '')
  )
}

export function createTrackingToken(site: number | null, path: string, now = Date.now()) {
  const body = Buffer.from(
    JSON.stringify({ site, path, nonce: randomUUID(), expires: now + 86400000 }),
  ).toString('base64url')
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`
}

export function verifyTrackingToken(token: unknown, now = Date.now()): TrackingClaims | null {
  if (typeof token !== 'string' || token.length > 2048 || !secret()) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const expected = createHmac('sha256', secret()).update(parts[0]).digest()
  const received = Buffer.from(parts[1], 'base64url')
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
    if (
      !(claims.site === null || (Number.isSafeInteger(claims.site) && claims.site > 0)) ||
      typeof claims.path !== 'string' ||
      claims.path.length > 500 ||
      !claims.path.startsWith('/') ||
      /[?#\\\s]/.test(claims.path) ||
      !validVisitorID(claims.nonce) ||
      typeof claims.expires !== 'number' ||
      claims.expires <= now ||
      claims.expires > now + 86400000
    )
      return null
    return claims
  } catch {
    return null
  }
}

export function validVisitorID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)
  )
}

export function analyticsVisitor(visitor: string, site: number | null) {
  return createHmac('sha256', secret())
    .update(`${site ?? 'default'}:${visitor}`)
    .digest('hex')
}

export function excludedTrackingRequest(headers: Headers) {
  return (
    headers.get('dnt') === '1' ||
    headers.get('sec-gpc') === '1' ||
    /bot|crawler|spider|headless|lighthouse|preview|facebookexternalhit|slurp/i.test(
      headers.get('user-agent') || '',
    )
  )
}

export function referrerHostname(value: unknown, origin: string) {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && url.origin !== origin
      ? url.hostname.slice(0, 253)
      : undefined
  } catch {
    return undefined
  }
}
