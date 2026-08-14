import configPromise from '@payload-config'
import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export default async function NotFound({ params, searchParams }: Args) {
  const config = await configPromise

  return NotFoundPage({ config: Promise.resolve(config), importMap, params, searchParams })
}
