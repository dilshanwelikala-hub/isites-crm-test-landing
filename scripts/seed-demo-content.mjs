import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())

const { getPayload } = await import('payload')
const { default: config } = await import('../payload.config.ts')
const { defaultContent, defaultPackages } = await import('../src/lib/landingDefaults.ts')

const payload = await getPayload({ config })

await payload.updateGlobal({
  slug: 'landing-page',
  data: {
    ...defaultContent,
    _status: 'published',
  },
})

for (const [index, offer] of defaultPackages.entries()) {
  const existing = await payload.find({
    collection: 'landing-packages',
    limit: 1,
    where: {
      slug: {
        equals: offer.slug,
      },
    },
  })

  const data = {
    ...offer,
    displayOrder: index + 1,
    featured: index < 3,
    _status: 'published',
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'landing-packages',
      id: existing.docs[0].id,
      data,
    })
  } else {
    await payload.create({
      collection: 'landing-packages',
      data,
    })
  }
}

await payload.db.destroy?.()

console.log('Demo landing page content seeded.')
