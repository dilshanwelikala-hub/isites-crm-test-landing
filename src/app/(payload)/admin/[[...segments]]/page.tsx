import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const config = await configPromise

  return generatePageMetadata({ config: Promise.resolve(config), params, searchParams })
}

export default async function Page({ params, searchParams }: Args) {
  const config = await configPromise

  return RootPage({ config: Promise.resolve(config), params, searchParams, importMap })
}
