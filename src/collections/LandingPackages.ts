import type { CollectionConfig } from 'payload'

export const LandingPackages: CollectionConfig = {
  slug: 'landing-packages',
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ['title', 'category', 'displayOrder', '_status'],
    group: 'Landing Page',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
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
