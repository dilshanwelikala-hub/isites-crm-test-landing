import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PayloadRequest } from 'payload'
import { getSiteURL } from './siteURL'

const lifetime = 15 * 60 * 1000
type SearchParams = Record<string, string | string[] | undefined>

function signingKey() {
  const key = process.env.PREVIEW_SECRET
  // A dedicated key is required. Preview must never expose or reuse the auth key.
  return key && key.length >= 32 && key !== process.env.PAYLOAD_SECRET ? key : null
}

function validPath(path: string) {
  return (
    path.startsWith('/') && !path.startsWith('//') && path.length <= 1000 && !/[?#\\\s]/.test(path)
  )
}

export function createPreviewToken(path: string, now = Date.now()) {
  const key = signingKey()
  if (!key || !validPath(path)) return null
  const body = Buffer.from(JSON.stringify({ v: 1, path, expires: now + lifetime })).toString(
    'base64url',
  )
  return `${body}.${createHmac('sha256', key).update(body).digest('base64url')}`
}

export function verifyPreviewToken(token: unknown, path: string, now = Date.now()) {
  const key = signingKey()
  if (!key || typeof token !== 'string' || token.length > 3000 || !validPath(path)) return false
  const parts = token.split('.')
  if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false
  const expected = createHmac('sha256', key).update(parts[0]).digest()
  const received = Buffer.from(parts[1], 'base64url')
  if (
    received.toString('base64url') !== parts[1] ||
    received.length !== expected.length ||
    !timingSafeEqual(expected, received)
  )
    return false
  try {
    const claims = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    return (
      claims.v === 1 &&
      claims.path === path &&
      Number.isSafeInteger(claims.expires) &&
      claims.expires > now &&
      claims.expires <= now + lifetime
    )
  } catch {
    return false
  }
}

export function previewEnabled(params: SearchParams, path: string) {
  return (
    params.preview === 'true' &&
    typeof params.previewToken === 'string' &&
    verifyPreviewToken(params.previewToken, path)
  )
}

export function previewURL(path: string) {
  const token = createPreviewToken(path)
  if (!token) return null
  const url = new URL(path, getSiteURL())
  url.searchParams.set('preview', 'true')
  url.searchParams.set('previewToken', token)
  return url.toString()
}

export function sitePath(slug: string) {
  return `/sites/${encodeURIComponent(slug)}`
}

export function packagePath(slug: string, siteSlug?: string) {
  return `${siteSlug ? sitePath(siteSlug) : ''}/packages/${encodeURIComponent(slug)}`
}

export async function packagePreviewURL(doc: Record<string, unknown>, req: PayloadRequest) {
  if (!req.user || typeof doc.slug !== 'string') return null
  if (!doc.site) return previewURL(packagePath(doc.slug))
  // Payload may supply either a populated relationship or just its ID.
  const value = doc.site
  const id = typeof value === 'object' && value && 'id' in value ? value.id : value
  if (typeof id !== 'number' && typeof id !== 'string') return null
  const site = await req.payload.findByID({
    collection: 'sites',
    id,
    depth: 0,
    req,
    overrideAccess: false,
    disableErrors: true,
  })
  return typeof site?.slug === 'string' ? previewURL(packagePath(doc.slug, site.slug)) : null
}
