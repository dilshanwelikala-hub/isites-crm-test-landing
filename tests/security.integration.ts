import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import type { Payload, TypedUser } from 'payload'
import { packagePreviewURL, verifyPreviewToken, packagePath } from '../src/lib/preview'

let payload: Payload
let directory: string
let siteA: number
let siteB: number
let draftSite: number
let archivedSite: number
let publicPackage: number
let privatePackage: number
let admin: TypedUser
const external = {
  overrideAccess: false,
  req: { payloadAPI: 'REST' as const, headers: new Headers() },
}
const form = (email = `${randomUUID()}@example.test`) => ({
  name: 'Visitor',
  email,
  message: 'Please send details',
  consentToContact: true,
})

before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'isites-security-'))
  Object.assign(process.env, {
    DATABASE_URL: '',
    POSTGRES_URL: '',
    BLOB_READ_WRITE_TOKEN: '',
    VERCEL_BLOB_READ_WRITE_TOKEN: '',
    DATABASE_URI: `file:${path.join(directory, 'qa.db').replaceAll('\\', '/')}`,
    PAYLOAD_SECRET: randomUUID(),
    PREVIEW_SECRET: randomUUID(),
    NODE_ENV: 'development',
  })
  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config')
  payload = await getPayload({ config })
  admin = await payload.create({
    collection: 'users',
    data: { email: 'security-admin@example.test', password: randomUUID() },
  })
  const site = async (
    slug: string,
    status: 'draft' | 'published' = 'published',
    siteStatus = 'live',
  ) =>
    (
      await payload.create({
        collection: 'sites',
        data: { name: slug, slug, hero: { title: slug }, _status: status, siteStatus },
      })
    ).id
  siteA = await site('security-a')
  siteB = await site('security-b')
  draftSite = await site('PRIVATE-DRAFT-SITE', 'draft')
  archivedSite = await site('PRIVATE-ARCHIVED-SITE', 'published', 'archived')
  const offer = async (slug: string, site?: number, status: 'draft' | 'published' = 'published') =>
    (
      await payload.create({
        collection: 'landing-packages',
        data: { title: slug, slug, summary: slug, category: 'curated', site, _status: status },
      })
    ).id
  publicPackage = await offer('shared-offer', siteA)
  privatePackage = await offer('PRIVATE-DRAFT-PACKAGE', siteA, 'draft')
  await offer('shared-offer', siteB)
  await offer('PRIVATE-PARENT-DRAFT', draftSite)
  await offer('PRIVATE-PARENT-ARCHIVED', archivedSite)
  await offer('default-offer')
  await payload.updateGlobal({
    slug: 'landing-page',
    data: { hero: { title: 'Published default homepage' }, _status: 'published' },
  })
})

after(async () => {
  await payload?.db.destroy?.()
  ;(payload?.db as unknown as { client?: { close(): void } })?.client?.close()
  if (directory) {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('isites-security-'))
    await rm(directory, { recursive: true, force: true, maxRetries: 6, retryDelay: 200 })
  }
})

test('anonymous queries and IDs exclude drafts, archived sites, and packages whose parent is private', async () => {
  for (const draft of [false, true]) {
    const sites = await payload.find({
      collection: 'sites',
      ...external,
      draft,
      depth: 0,
      pagination: false,
    })
    assert.deepEqual(sites.docs.map((doc) => doc.id).sort(), [siteA, siteB].sort())
    const offers = await payload.find({
      collection: 'landing-packages',
      ...external,
      draft,
      depth: 2,
      pagination: false,
    })
    assert.equal(JSON.stringify(offers.docs).includes('PRIVATE-'), false)
    assert.equal(offers.docs.length, 3)
    const count = await payload.count({ collection: 'landing-packages', ...external })
    assert.equal(count.totalDocs, 3)
    await assert.rejects(
      payload.findByID({ collection: 'sites', id: draftSite, ...external, draft }),
    )
    await assert.rejects(
      payload.findByID({ collection: 'landing-packages', id: privatePackage, ...external, draft }),
    )
  }
  const forgedFilter = await payload.find({
    collection: 'sites',
    ...external,
    draft: true,
    where: { _status: { equals: 'draft' } },
  })
  assert.equal(forgedFilter.totalDocs, 0)
  await assert.rejects(payload.findVersions({ collection: 'sites', ...external }))
  await assert.rejects(payload.findVersions({ collection: 'landing-packages', ...external }))
  await assert.rejects(payload.findGlobalVersions({ slug: 'landing-page', ...external }))
  const editor = await payload.findByID({
    collection: 'sites',
    id: draftSite,
    draft: true,
    user: admin,
    overrideAccess: false,
  })
  assert.equal(editor._status, 'draft')
})

test('draft edits never replace published fields in anonymous collection or global reads', async () => {
  await payload.update({
    collection: 'sites',
    id: siteA,
    draft: true,
    data: { hero: { title: 'PRIVATE-SITE-EDIT' } },
  })
  await payload.update({
    collection: 'landing-packages',
    id: publicPackage,
    draft: true,
    data: { summary: 'PRIVATE-OFFER-EDIT' },
  })
  await payload.updateGlobal({
    slug: 'landing-page',
    draft: true,
    data: { hero: { title: 'PRIVATE-GLOBAL-EDIT' } },
  })
  const site = await payload.findByID({
    collection: 'sites',
    id: siteA,
    ...external,
    draft: false,
    select: { hero: true },
  })
  assert.equal(site.hero.title, 'security-a')
  const offer = await payload.findByID({
    collection: 'landing-packages',
    id: publicPackage,
    ...external,
    draft: false,
  })
  assert.equal(offer.summary, 'shared-offer')
  // Depending on the draft query shape Payload returns the published snapshot
  // or no document. Neither response may expose the pending version.
  for (const collection of ['sites', 'landing-packages'] as const) {
    const doc = await payload.findByID({
      collection,
      id: collection === 'sites' ? siteA : publicPackage,
      ...external,
      draft: true,
      disableErrors: true,
      select: collection === 'sites' ? { hero: true } : { summary: true },
    })
    assert.equal(JSON.stringify(doc).includes('PRIVATE-'), false)
  }
  const global = await payload.findGlobal({
    slug: 'landing-page',
    ...external,
    draft: true,
    select: { hero: true },
  })
  assert.equal(global.hero.title, 'Published default homepage')
  const editor = await payload.findGlobal({
    slug: 'landing-page',
    user: admin,
    overrideAccess: false,
    draft: true,
  })
  assert.equal(editor.hero.title, 'PRIVATE-GLOBAL-EDIT')
})

test('unpublished default homepage is not exposed through global reads', async () => {
  await payload.updateGlobal({
    slug: 'landing-page',
    data: { _status: 'draft', hero: { title: 'PRIVATE-UNPUBLISHED-GLOBAL' } },
  })
  const result = await payload.findGlobal({ slug: 'landing-page', ...external, draft: true })
  assert.equal(JSON.stringify(result).includes('PRIVATE-'), false)
  await payload.updateGlobal({
    slug: 'landing-page',
    data: { _status: 'published', hero: { title: 'Published default homepage' } },
  })
})

test('default-site and same-site submissions preserve customer identity and lifecycle', async () => {
  const email = 'existing-customer@example.test'
  const customer = await payload.create({
    collection: 'contacts',
    data: {
      name: 'Verified customer',
      email,
      site: siteA,
      phone: '555-0100',
      company: 'Verified company',
      lifecycleStage: 'customer',
      preferredChannel: 'phone',
      leadSource: 'referral',
      owner: admin.id,
      notes: [{ note: 'Private customer note' }],
    },
  })
  const defaultLead = await payload.create({
    collection: 'inquiries',
    ...external,
    depth: 2,
    data: { ...form(email), name: 'Untrusted default name' },
  })
  assert.notEqual(
    typeof defaultLead.contact === 'object' ? defaultLead.contact?.id : defaultLead.contact,
    customer.id,
  )
  await payload.create({
    collection: 'inquiries',
    ...external,
    data: {
      ...form(email.toUpperCase()),
      site: siteA,
      name: 'Untrusted name',
      phone: '555-9999',
      company: 'Untrusted company',
    },
  })
  const after = await payload.findByID({ collection: 'contacts', id: customer.id, depth: 0 })
  assert.equal(after.name, 'Verified customer')
  assert.equal(after.site, siteA)
  assert.equal(after.lifecycleStage, 'customer')
  assert.equal(after.phone, '555-0100')
  assert.equal(after.company, 'Verified company')
  assert.equal(after.preferredChannel, 'phone')
  assert.equal(after.leadSource, 'referral')
  assert.equal(after.owner, admin.id)
  assert.equal(after.notes?.[0].note, 'Private customer note')
  assert.equal(JSON.stringify(defaultLead).includes('Private customer note'), false)
})

test('public forms cannot assign internal CRM fields or forge package metadata', async () => {
  const lead = await payload.create({
    collection: 'inquiries',
    ...external,
    depth: 0,
    data: {
      ...form(),
      site: siteA,
      packageSlug: 'shared-offer',
      package: privatePackage,
      packageTitle: 'Forged title',
      contact: 999999,
      status: 'won',
      priority: 'high',
      estimatedValue: 99999,
      assignedOwner: admin.id,
      internalNotes: [{ note: 'Forged internal note' }],
      followUpAt: new Date().toISOString(),
      sourcePageUrl: 'https://example.test/offer?email=private@example.test#private',
    },
  })
  assert.equal(lead.status, 'new')
  assert.equal(lead.priority, 'normal')
  assert.ok(!lead.assignedOwner && !lead.estimatedValue && !lead.followUpAt)
  assert.equal(lead.internalNotes?.length ?? 0, 0)
  assert.equal(lead.package, publicPackage)
  assert.equal(lead.packageTitle, 'shared-offer')
  assert.equal(lead.sourcePageUrl, 'https://example.test/offer')
  const edited = await payload.update({
    collection: 'inquiries',
    id: lead.id,
    user: admin,
    overrideAccess: false,
    data: {
      status: 'won',
      priority: 'high',
      internalNotes: [{ note: 'Authorized staff note' }],
    },
  })
  assert.equal(edited.status, 'won')
  assert.equal(edited.internalNotes?.[0].note, 'Authorized staff note')
})

test('invalid consent, site, package, and field values cannot create contacts', async () => {
  for (const changes of [
    { consentToContact: false },
    { consentToContact: 'false' },
    { message: '' },
    { name: '' },
    { email: 'invalid' },
    { guestCount: -1 },
    { guestCount: 1.5 },
    { message: 'x'.repeat(10001) },
    { site: 'invalid' },
    { site: draftSite },
    { site: archivedSite },
    { site: siteB, packageSlug: 'PRIVATE-DRAFT-PACKAGE' },
    { site: siteA, packageSlug: 'PRIVATE-DRAFT-PACKAGE' },
    { packageSlug: 'shared-offer' },
  ]) {
    const before = await payload.count({ collection: 'contacts' })
    await assert.rejects(
      payload.create({
        collection: 'inquiries',
        ...external,
        data: { ...form(), ...changes } as any,
      }),
      `Expected rejection for ${JSON.stringify(changes).slice(0, 120)}`,
    )
    assert.equal((await payload.count({ collection: 'contacts' })).totalDocs, before.totalDocs)
  }
})

test('request transaction rolls back contact writes when later inquiry validation fails', async () => {
  const email = 'transaction-rejected@example.test'
  await assert.rejects(
    payload.create({
      collection: 'inquiries',
      data: { name: 'Local rejected lead', email, site: siteA } as any,
    }),
  )
  assert.equal(
    (await payload.count({ collection: 'contacts', where: { email: { equals: email } } }))
      .totalDocs,
    0,
  )
  const customer = await payload.create({
    collection: 'contacts',
    data: { name: 'Customer', email, site: siteA, lifecycleStage: 'customer' },
  })
  await assert.rejects(
    payload.create({
      collection: 'inquiries',
      data: { name: 'Invalid lead', email, site: siteA } as any,
    }),
  )
  const after = await payload.findByID({ collection: 'contacts', id: customer.id })
  assert.equal(after.lastInquiryAt, customer.lastInquiryAt)
  assert.equal(after.lifecycleStage, 'customer')
})

test('package preview resolves numeric site relationships and uses the correct scoped URL', async () => {
  const { createLocalReq } = await import('payload')
  const req = await createLocalReq({ user: admin }, payload)
  const url = await packagePreviewURL({ slug: 'shared-offer', site: siteA }, req)
  assert.ok(url)
  const parsed = new URL(url)
  assert.equal(parsed.pathname, packagePath('shared-offer', 'security-a'))
  assert.equal(verifyPreviewToken(parsed.searchParams.get('previewToken'), parsed.pathname), true)
})
