import config from '@payload-config'
import { getPayload } from 'payload'

import { collectAnalytics } from '../../../../lib/collectAnalytics'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    return await collectAnalytics(request, await getPayload({ config }))
  } catch {
    console.error('Unable to save site analytics event.')
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
