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
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
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
    staticDir: path.resolve(dirname, '../../public/media'),
    imageSizes: [
      {
        name: 'card',
        width: 900,
        height: 650,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1800,
        height: 1000,
        position: 'centre',
      },
    ],
  },
}
