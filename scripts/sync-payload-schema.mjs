const databaseURL = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!databaseURL) {
  console.log('No hosted Postgres URL found. Skipping Payload schema sync.')
  process.exit(0)
}

const originalNodeEnv = process.env.NODE_ENV

try {
  // Payload only auto-syncs SQL schema outside production. This build-time sync
  // creates the initial demo tables in Neon before the production app starts.
  process.env.NODE_ENV = 'development'

  const { getPayload } = await import('payload')
  const { default: config } = await import('../payload.config.ts')
  const payload = await getPayload({ config })

  await payload.db.destroy?.()
  console.log('Payload schema synced to hosted Postgres.')
} finally {
  process.env.NODE_ENV = originalNodeEnv
}
