import { randomUUID } from 'node:crypto'
import { mkdtemp } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import { spawn } from 'node:child_process'

if (process.env.VERCEL || process.env.NODE_ENV === 'production')
  throw new Error('Analytics preview is local-only.')
const probe = createServer()
await new Promise((resolve, reject) => {
  probe.once('error', reject)
  probe.listen(0, '127.0.0.1', resolve)
})
const port = probe.address().port
await new Promise((resolve) => probe.close(resolve))
const directory = await mkdtemp(path.join(process.cwd(), '.analytics-preview-'))
Object.assign(process.env, {
  DATABASE_URL: '',
  POSTGRES_URL: '',
  BLOB_READ_WRITE_TOKEN: '',
  VERCEL_BLOB_READ_WRITE_TOKEN: '',
  DATABASE_URI: `file:${path.join(directory, 'preview.db').replaceAll('\\', '/')}`,
  PAYLOAD_SECRET: randomUUID(),
  NODE_ENV: 'development',
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
})
const { getPayload } = await import('payload')
const { default: config } = await import('../payload.config.ts')
const { analyticsVisitor, createTrackingToken } = await import('../src/lib/analyticsServer.ts')
const payload = await getPayload({ config })
const password = randomUUID()
await payload.create({
  collection: 'users',
  data: { name: 'Local Analytics Demo', email: 'analytics-preview@example.test', password },
})
await payload.updateGlobal({
  slug: 'landing-page',
  data: { analyticsEnabled: true, _status: 'published' },
})
for (const [name, slug] of [
  ['Analytics Resort', 'analytics-resort'],
  ['Analytics Restaurant', 'analytics-restaurant'],
]) {
  const site = await payload.create({
    collection: 'sites',
    data: { name, slug, hero: { title: name }, analyticsEnabled: true, _status: 'published' },
  })
  const offer = { slug: 'weekend', title: `${name} Weekend` }
  await payload.create({
    collection: 'landing-packages',
    data: {
      ...offer,
      site: site.id,
      summary: 'Local analytics demonstration package.',
      primaryAction: { label: 'Ask about this offer', url: `/sites/${slug}/packages/weekend` },
      _status: 'published',
    },
  })
  if (slug !== 'analytics-resort') continue
  for (const [source, medium, campaign, status] of [
    ['email', 'newsletter', 'autumn-offers', 'won'],
    ['social', 'paid', 'weekend-escape', 'proposal_sent'],
    ['search', 'organic', 'autumn-offers', 'qualified'],
  ]) {
    const visitor = randomUUID()
    const createdAt = new Date(Date.now() - 86400000).toISOString()
    const token = createTrackingToken(site.id, `/sites/${slug}/packages/weekend`, Date.now(), offer)
    for (const [eventType, pagePath] of [
      ['page_view', `/sites/${slug}`],
      ['page_view', `/sites/${slug}/packages/weekend`],
      ['click', `/sites/${slug}/packages/weekend`],
    ]) {
      await payload.create({
        collection: 'analytics-events',
        data: {
          eventID: randomUUID(),
          pageKey: randomUUID(),
          site: site.id,
          eventType,
          path: pagePath,
          visitor: analyticsVisitor(visitor, site.id),
          action: eventType === 'click' ? 'package_primary' : undefined,
          attributionVersion: 2,
          utmSource: source,
          utmMedium: medium,
          utmCampaign: campaign,
          packageSlug: pagePath.includes('/packages/') ? offer.slug : undefined,
          packageTitle: pagePath.includes('/packages/') ? offer.title : undefined,
          createdAt,
        },
      })
    }
    await payload.create({
      collection: 'inquiries',
      data: {
        name: 'Sample lead',
        email: `${source}@example.test`,
        message: 'Sample local inquiry.',
        site: site.id,
        packageSlug: offer.slug,
        packageTitle: offer.title,
        status,
        createdAt,
        analyticsInput: { token, visitor, attribution: { source, medium, campaign } },
      },
    })
  }
}
await payload.db.destroy?.()
payload.db.client?.close()
console.log(
  `LOCAL_PREVIEW=http://localhost:${port}/admin?workspace=cms&view=analytics&site=1&tab=campaigns`,
)
console.log('LOCAL_DEMO_EMAIL=analytics-preview@example.test')
console.log(`LOCAL_DEMO_PASSWORD=${password}`)
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)],
  { stdio: 'inherit', windowsHide: true, env: process.env },
)
child.on('exit', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
