import type { GlobalConfig } from 'payload'

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Landing Page',
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Packages',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          defaultValue: 'Packages & Experiences',
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            'Enhance your stay with curated packages, local collaborations, and memorable seasonal events.',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'fallbackImageUrl',
          type: 'text',
          defaultValue:
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80',
        },
      ],
    },
    {
      name: 'intro',
      type: 'group',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Choose the stay that fits the moment',
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue:
            'From relaxed escapes to partner-led adventures, each offer is designed to make planning simple and the experience feel considered.',
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      fields: [
        {
          name: 'key',
          type: 'select',
          required: true,
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
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
      defaultValue: [
        {
          key: 'curated',
          label: 'Curated Getaways',
          heading: 'Curated Getaway Packages',
          description: 'Thoughtfully designed resort packages for an easier escape.',
        },
        {
          key: 'partner',
          label: 'Partner Experiences',
          heading: 'Featured Partner Experiences',
          description: 'Experiences offered with trusted local partners.',
        },
        {
          key: 'events',
          label: 'Ticketed Events',
          heading: 'Signature Ticketed Events',
          description: 'Seasonal dinners, celebrations, and resort events worth planning around.',
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Stay Connected',
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue: 'Keep up to date on the latest offers, events, and news.',
        },
        {
          name: 'buttonLabel',
          type: 'text',
          defaultValue: 'Sign up',
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'brand',
          type: 'text',
          defaultValue: 'The Test Resort',
        },
        {
          name: 'address',
          type: 'text',
          defaultValue: '70 Mountain Way, Essex, VT',
        },
        {
          name: 'phone',
          type: 'text',
          defaultValue: '802-878-1100',
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Packages & Experiences | Test Landing CMS',
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            'A CMS-managed landing page for resort packages, partner experiences, and ticketed events.',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
