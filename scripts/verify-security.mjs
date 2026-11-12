// Builds and smoke-tests production routes using a brand-new temporary database.
// Never invokes the hosted schema-sync build script or loads real storage tokens.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directory = await mkdtemp(path.join(os.tmpdir(), 'isites-security-http-'))
const probe = createServer()
await new Promise((resolve, reject) => {
  probe.once('error', reject)
  probe.listen(0, '127.0.0.1', resolve)
})
const port = probe.address().port
await new Promise((resolve) => probe.close(resolve))
const origin = `http://127.0.0.1:${port}`
Object.assign(process.env, {
  DATABASE_URL: '',
  POSTGRES_URL: '',
  BLOB_READ_WRITE_TOKEN: '',
  VERCEL_BLOB_READ_WRITE_TOKEN: '',
  DATABASE_URI: `file:${path.join(directory, 'qa.db').replaceAll('\\', '/')}`,
  PAYLOAD_SECRET: randomUUID(),
  PREVIEW_SECRET: randomUUID(),
  NODE_ENV: 'development',
  NEXT_PUBLIC_SITE_URL: origin,
  PAYLOAD_PUBLIC_SITE_URL: origin,
  NEXT_TELEMETRY_DISABLED: '1',
})
const { getPayload } = await import('payload')
const { default: config } = await import('../payload.config.ts')
const { createPreviewToken } = await import('../src/lib/preview.ts')
let payload
let server
let serverLog = ''
const results = []
const check = (name, detail) => {
  results.push({ name, ...detail })
  console.log(`PASS ${name}`)
}
const next = path.join(root, 'node_modules/next/dist/bin/next')

try {
  payload = await getPayload({ config })
  const password = randomUUID()
  await payload.create({
    collection: 'users',
    data: { email: 'http-admin@example.test', password },
  })
  await payload.updateGlobal({
    slug: 'landing-page',
    data: { _status: 'published', hero: { title: 'Public HTTP homepage' } },
  })
  await payload.updateGlobal({
    slug: 'landing-page',
    draft: true,
    data: { hero: { title: 'PRIVATE HTTP homepage edit' } },
  })
  const publicSite = await payload.create({
    collection: 'sites',
    data: {
      name: 'HTTP Public',
      slug: 'http-public',
      hero: { title: 'Public HTTP site' },
      _status: 'published',
    },
  })
  const draftSite = await payload.create({
    collection: 'sites',
    data: {
      name: 'PRIVATE HTTP site',
      slug: 'http-draft',
      hero: { title: 'PRIVATE HTTP site' },
      _status: 'draft',
    },
  })
  const offer = async (slug, site, status = 'published') =>
    payload.create({
      collection: 'landing-packages',
      data: {
        title: `${status === 'draft' ? 'PRIVATE' : 'Public'} HTTP ${slug}`,
        slug,
        site,
        summary: 'HTTP test offer',
        category: 'curated',
        _status: status,
      },
    })
  await offer('http-offer', publicSite.id)
  await offer('http-private-offer', publicSite.id, 'draft')
  await offer('http-parent-private', draftSite.id)
  await offer('http-root-private', undefined, 'draft')
  const customer = await payload.create({
    collection: 'contacts',
    data: {
      name: 'Verified HTTP customer',
      email: 'http-customer@example.test',
      site: publicSite.id,
      lifecycleStage: 'customer',
      notes: [{ note: 'PRIVATE HTTP contact note' }],
    },
  })
  await payload.db.destroy?.()
  payload.db.client?.close?.()
  payload = null

  const childEnv = { ...process.env, NODE_ENV: 'production' }
  if (!process.argv.includes('--skip-build')) {
    const build = spawn(process.execPath, [next, 'build', '--webpack'], {
      cwd: root,
      env: childEnv,
      stdio: 'inherit',
      windowsHide: true,
    })
    const code = await new Promise((resolve, reject) => {
      build.once('error', reject)
      build.once('exit', resolve)
    })
    assert.equal(code, 0, 'Isolated production build must pass')
    check('isolated production build', { passed: true })
  }
  server = spawn(process.execPath, [next, 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: root,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  for (const stream of [server.stdout, server.stderr])
    stream.on('data', (chunk) => {
      serverLog = (serverLog + chunk.toString()).slice(-18000)
    })
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${serverLog}`)
    try {
      const response = await fetch(`${origin}/admin/login`, { signal: AbortSignal.timeout(3000) })
      await response.body?.cancel()
      if (response.ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  assert.ok(ready, `Server did not become ready: ${serverLog}`)

  const get = async (url) => {
    const response = await fetch(`${origin}${url}`, { signal: AbortSignal.timeout(20000) })
    return { response, text: await response.text() }
  }
  for (const url of ['/', '/sites/http-public', '/sites/http-public/packages/http-offer']) {
    const { response, text } = await get(url)
    assert.equal(response.status, 200, url)
    assert.equal(text.includes('PRIVATE HTTP'), false, url)
    assert.equal(text.includes('Application error'), false, url)
  }
  for (const url of [
    '/sites/http-draft',
    '/sites/http-public/packages/http-private-offer',
    '/packages/http-root-private',
  ]) {
    const { response, text } = await get(url)
    assert.equal(response.status, 404, url)
    assert.equal(text.includes('PRIVATE HTTP'), false, url)
  }
  check('public pages and unpublished page rejection', { passed: true })

  for (const url of [
    '/api/sites?draft=true&depth=2',
    '/api/landing-packages?draft=true&depth=2',
    '/api/globals/landing-page?draft=true',
    '/api/sites?where[_status][equals]=draft&draft=true',
  ]) {
    const { response, text } = await get(url)
    assert.equal(response.status, 200, url)
    assert.equal(text.includes('PRIVATE HTTP'), false, url)
  }
  const { response: versions } = await get('/api/sites/versions')
  assert.ok([401, 403, 404].includes(versions.status))
  const graphResponse = await fetch(`${origin}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query:
        '{ Sites(draft: true, limit: 100) { docs { name slug hero { title } } } LandingPackages(draft: true, limit: 100) { docs { title slug } } LandingPage(draft: true) { hero { title } } }',
    }),
  })
  const graph = await graphResponse.json()
  assert.ok(!graph.errors, JSON.stringify(graph.errors))
  assert.equal(JSON.stringify(graph).includes('PRIVATE HTTP'), false)
  check('REST GraphQL and version access rules', { passed: true })

  for (const url of [
    '/',
    '/sites/http-draft',
    '/sites/http-public/packages/http-private-offer',
    '/packages/http-root-private',
  ]) {
    const token = createPreviewToken(url)
    const { response, text } = await get(
      `${url}?preview=true&previewToken=${encodeURIComponent(token)}`,
    )
    assert.equal(response.status, 200, url)
    assert.ok(text.includes('PRIVATE HTTP'), url)
    assert.ok(response.headers.get('x-robots-tag')?.includes('noindex'))
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
    assert.ok(response.headers.get('cache-control')?.includes('no-store'))
  }
  const wrong = createPreviewToken('/sites/http-draft')
  assert.equal(
    (
      await get(
        `/packages/http-root-private?preview=true&previewToken=${encodeURIComponent(wrong)}`,
      )
    ).response.status,
    404,
  )
  assert.equal(
    (
      await get(
        `/sites/http-draft?preview=true&previewToken=${encodeURIComponent(process.env.PAYLOAD_SECRET)}`,
      )
    ).response.status,
    404,
  )
  check('scoped preview links on all four page routes', { passed: true })

  const post = async (data) => {
    const response = await fetch(`${origin}/api/inquiries?depth=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(data),
    })
    return { response, result: await response.json() }
  }
  const data = {
    name: 'Untrusted visitor',
    email: customer.email,
    message: 'HTTP test inquiry',
    consentToContact: true,
  }
  const created = await post({
    ...data,
    status: 'won',
    priority: 'high',
    internalNotes: [{ note: 'forged' }],
  })
  assert.equal(created.response.status, 201, JSON.stringify(created.result))
  assert.equal(created.result.doc.status, 'new')
  assert.equal(created.result.doc.priority, 'normal')
  assert.equal(JSON.stringify(created.result).includes('PRIVATE HTTP contact note'), false)
  assert.equal(
    (await post({ ...data, site: publicSite.id, packageSlug: 'http-offer' })).response.status,
    201,
  )
  assert.equal((await post({ ...data, consentToContact: false })).response.status, 400)
  assert.equal((await post({ ...data, site: draftSite.id })).response.status, 400)
  assert.equal((await post({ ...data, packageSlug: 'http-offer' })).response.status, 400)
  check('real REST inquiry validation and creation', { passed: true })

  const login = await fetch(`${origin}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'http-admin@example.test', password }),
  })
  const auth = await login.json()
  assert.equal(login.status, 200)
  assert.ok(auth.token)
  const contact = await fetch(`${origin}/api/contacts/${customer.id}?depth=0`, {
    headers: { Authorization: `JWT ${auth.token}` },
  })
  const saved = await contact.json()
  assert.equal(saved.name, 'Verified HTTP customer')
  assert.equal(saved.lifecycleStage, 'customer')
  assert.equal(saved.site, publicSite.id)
  const adminResponse = await fetch(`${origin}/admin`, {
    headers: { Cookie: `payload-token=${auth.token}` },
    redirect: 'manual',
  })
  assert.equal(adminResponse.status, 200)
  assert.equal((await adminResponse.text()).includes('Application error'), false)
  check('login admin dashboard and preserved customer record', { passed: true })

  await writeFile(
    path.join(root, '.security-work/http-results.json'),
    JSON.stringify({ results }, null, 2),
  )
  console.log(`Verified ${results.length} groups against an isolated production server.`)
} catch (error) {
  console.error(error)
  if (serverLog) console.error(serverLog)
  process.exitCode = 1
} finally {
  if (server && server.exitCode === null) {
    server.kill()
    await new Promise((resolve) => {
      server.once('exit', resolve)
      setTimeout(resolve, 5000)
    })
  }
  if (payload) {
    await payload.db.destroy?.()
    payload.db.client?.close?.()
  }
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
  assert.ok(path.basename(directory).startsWith('isites-security-http-'))
  await rm(directory, { recursive: true, force: true, maxRetries: 6, retryDelay: 200 })
}
