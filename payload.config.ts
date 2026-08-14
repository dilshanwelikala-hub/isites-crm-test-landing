import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { LandingPackages } from './src/collections/LandingPackages'
import { Media } from './src/collections/Media'
import { Users } from './src/collections/Users'
import { LandingPage } from './src/globals/LandingPage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const databaseURL = process.env.DATABASE_URL || process.env.POSTGRES_URL

export default buildConfig({
  admin: {
    routes: {
      account: '/account',
      createFirstUser: '/create-first-user',
      forgot: '/forgot',
      inactivity: '/logout-inactivity',
      login: '/login',
      logout: '/logout',
      reset: '/reset',
      unauthorized: '/unauthorized',
    },
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, LandingPackages],
  db: databaseURL
    ? postgresAdapter({
        pool: {
          connectionString: databaseURL,
        },
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || 'file:./payload-data.db',
        },
      }),
  editor: lexicalEditor({}),
  globals: [LandingPage],
  routes: {
    admin: '/admin',
    api: '/api',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
