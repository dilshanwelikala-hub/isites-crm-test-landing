import configPromise from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  const config = await configPromise

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = async ({ children }: Args) => {
  const config = await configPromise

  return (
    <RootLayout config={Promise.resolve(config)} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
