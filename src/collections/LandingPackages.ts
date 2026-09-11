import type { CollectionConfig } from 'payload'

import { getSiteURL } from '../lib/siteURL'

function previewToken() {
  return process.env.PREVIEW_SECRET || process.env.PAYLOAD_SECRET
}

export const LandingPackages: CollectionConfig = {
  slug: 'landing-packages',
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ['title', 'site', 'category', 'displayOrder', '_status'],
    group: 'Landing Page',
    preview: (doc) => {
      const token = previewToken()

      if (!token || typeof doc.slug !== 'string') {
        return null
      }

      if (doc.site && typeof doc.site === 'object' && 'slug' in doc.site && typeof doc.site.slug === 'string') {
        return `${getSiteURL()}/sites/${doc.site.slug}/packages/${doc.slug}?preview=true&previewToken=${encodeURIComponent(
          token,
        )}`
      }

      return `${getSiteURL()}/packages/${doc.slug}?preview=true&previewToken=${encodeURIComponent(token)}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: {
        description: 'Assign this package to a specific website. Leave empty for the default demo site.',
        position: 'sidebar',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'Short URL-friendly identifier, for example rise-and-renew.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'curated',
      options: [
        {
          label: 'Curated Getaways',
          value: 'curated',
        },
        {
          label: 'Partner Experiences',
          value: 'partner',
        },
        {
          label: 'Ticketed Events',
          value: 'events',
        },
      ],
    },
    {
      name: 'badge',
      type: 'text',
      admin: {
        description: 'Small label shown above the offer title, for example Most Popular.',
      },
    },
    {
      name: 'priceLabel',
      type: 'text',
      admin: {
        description: 'Short price text, for example From $429 or Ticketed.',
      },
    },
    {
      name: 'duration',
      type: 'text',
      admin: {
        description: 'Short timing text, for example 2 nights or Half day.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'details',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'fallbackImageUrl',
      type: 'text',
      admin: {
        description: 'Optional image URL used before a real CMS upload is added.',
      },
    },
    {
      name: 'inclusions',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'primaryAction',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Book now',
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'secondaryAction',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'View details',
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  versions: {
    drafts: true,
  },
}
