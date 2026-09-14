import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ['alt', 'site', 'usage', 'updatedAt'],
    group: 'Assets',
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: {
        description: 'Optional site owner for this media item.',
        position: 'sidebar',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Short description of the image for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional public-facing caption or internal image note.',
      },
    },
    {
      name: 'usage',
      type: 'text',
      admin: {
        description: 'Suggested use, for example hero, package card, gallery, or social.',
        position: 'sidebar',
      },
    },
    {
      name: 'sourceCredit',
      type: 'text',
      admin: {
        description: 'Optional photographer, library, or client source credit.',
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
  upload: {
    adminThumbnail: 'thumb',
    displayPreview: true,
    focalPoint: true,
    mimeTypes: ['image/*'],
    pasteURL: false,
    staticDir: path.resolve(dirname, '../../public/media'),
    imageSizes: [
      {
        name: 'thumb',
        width: 320,
        height: 220,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'card',
        width: 900,
        height: 650,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'hero',
        width: 1800,
        height: 1000,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'openGraph',
        width: 1200,
        height: 630,
        position: 'centre',
        withoutEnlargement: true,
      },
    ],
    resizeOptions: {
      height: 2400,
      width: 2400,
      fit: 'inside',
      withoutEnlargement: true,
    },
  },
}
