export function getSiteURL() {
  const isVercel = Boolean(process.env.VERCEL)
  const candidates = isVercel
    ? [
        process.env.PAYLOAD_PUBLIC_SITE_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.VERCEL_URL,
      ]
    : [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.PAYLOAD_PUBLIC_SITE_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.VERCEL_URL,
      ]

  const url = candidates.find((value) => typeof value === 'string' && value.trim()) || 'http://localhost:3000'
  const normalizedURL = url.replace(/\/$/, '')

  return /^https?:\/\//.test(normalizedURL) ? normalizedURL : `https://${normalizedURL}`
}
