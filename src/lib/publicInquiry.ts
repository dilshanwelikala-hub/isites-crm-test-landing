import { APIError, type CollectionBeforeValidateHook, type Where } from 'payload'

const fields = new Set([
  'name',
  'email',
  'phone',
  'company',
  'preferredDate',
  'guestCount',
  'message',
  'inquiryType',
  'site',
  'packageSlug',
  'sourcePageUrl',
  'consentToContact',
  'analyticsInput',
])

export function siteScope(site: number | undefined): Where {
  return site === undefined ? { site: { exists: false } } : { site: { equals: site } }
}

// Run before the contact hook. UI read-only flags are not field authorization.
export const validatePublicInquiry: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || req.user || req.payloadAPI === 'local' || !data) return data
  const input = Object.fromEntries(Object.entries(data).filter(([key]) => fields.has(key)))
  for (const [key, max, required] of [
    ['name', 200, true],
    ['email', 254, true],
    ['message', 10000, true],
    ['phone', 80, false],
    ['company', 200, false],
    ['packageSlug', 200, false],
  ] as const) {
    if (input[key] == null && !required) continue
    if (
      typeof input[key] !== 'string' ||
      input[key].length > max ||
      (required && !input[key].trim())
    ) {
      throw new APIError(`Please provide a valid ${key}.`, 400)
    }
    input[key] = input[key].trim()
  }
  input.email = input.email.toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    throw new APIError('Please provide a valid email.', 400)
  if (input.consentToContact !== true) throw new APIError('Consent to contact is required.', 400)
  if (
    input.guestCount != null &&
    (!Number.isSafeInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 10000)
  ) {
    throw new APIError('Guest count must be a whole number between 1 and 10000.', 400)
  }
  let site: number | undefined
  if (input.site != null && input.site !== '') {
    if (
      !['string', 'number'].includes(typeof input.site) ||
      !/^\d+$/.test(String(input.site)) ||
      !Number.isSafeInteger(Number(input.site)) ||
      Number(input.site) < 1
    ) {
      throw new APIError('Invalid site.', 400)
    }
    site = Number(input.site)
    const record = await req.payload.findByID({
      collection: 'sites',
      id: site,
      req,
      depth: 0,
      draft: false,
      overrideAccess: false,
      disableErrors: true,
    })
    if (!record) throw new APIError('This site is not accepting inquiries.', 400)
  } else {
    const page = await req.payload.findGlobal({
      slug: 'landing-page',
      req,
      depth: 0,
      draft: false,
      overrideAccess: false,
    })
    if (page._status !== 'published')
      throw new APIError('This page is not accepting inquiries.', 400)
  }
  input.site = site ?? null
  if (input.packageSlug) {
    const packages = await req.payload.find({
      collection: 'landing-packages',
      req,
      depth: 0,
      draft: false,
      overrideAccess: false,
      limit: 1,
      where: { and: [siteScope(site), { slug: { equals: input.packageSlug } }] },
    })
    if (!packages.docs[0]) throw new APIError('This offer is not accepting inquiries.', 400)
    input.package = packages.docs[0].id
    input.packageTitle = packages.docs[0].title
  }
  if (input.sourcePageUrl) {
    try {
      if (typeof input.sourcePageUrl !== 'string' || input.sourcePageUrl.length > 2048)
        throw new Error()
      const url = new URL(input.sourcePageUrl)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
        throw new Error()
      input.sourcePageUrl = `${url.origin}${url.pathname}`
    } catch {
      throw new APIError('Invalid source page URL.', 400)
    }
  }
  return input
}
