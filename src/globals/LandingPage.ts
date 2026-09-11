import type { GlobalConfig } from 'payload'

import { getSiteURL } from '../lib/siteURL'

function previewToken() {
  return process.env.PREVIEW_SECRET || process.env.PAYLOAD_SECRET
}

export const LandingPage: GlobalConfig = {
  slug: 'landing-page',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Landing Page',
    preview: () => {
      const token = previewToken()

      if (!token) {
        return null
      }

      return `${getSiteURL()}/?preview=true&previewToken=${encodeURIComponent(token)}`
    },
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
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'Explore offers',
        },
        {
          name: 'ctaUrl',
          type: 'text',
          defaultValue: '#curated',
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
      name: 'alert',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'New',
        },
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Demo content is editable from the CMS and published directly to this page.',
        },
        {
          name: 'linkLabel',
          type: 'text',
          defaultValue: 'Open CMS',
        },
        {
          name: 'linkUrl',
          type: 'text',
          defaultValue: '/admin',
        },
      ],
    },
    {
      name: 'intro',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Packages & Experiences',
        },
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
      name: 'stats',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
      defaultValue: [
        {
          value: '3',
          label: 'Editable content sections',
        },
        {
          value: '7',
          label: 'Demo offers ready to publish',
        },
        {
          value: 'Live',
          label: 'CMS-powered page rendering',
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
      name: 'feature',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Why book direct',
        },
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'A simpler way to package the whole stay',
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue:
            'The CMS separates page content from the design, so editors can publish polished offers without touching layout code.',
        },
        {
          name: 'points',
          type: 'array',
          fields: [
            {
              name: 'item',
              type: 'text',
              required: true,
            },
          ],
          defaultValue: [
            {
              item: 'Draft and publish workflow for every offer',
            },
            {
              item: 'Editable SEO, hero, sections, and calls to action',
            },
            {
              item: 'Ready to extend with cloud media storage and preview links',
            },
          ],
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'Newsletter',
        },
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
        {
          name: 'buttonUrl',
          type: 'text',
          defaultValue: '#',
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
        {
          name: 'email',
          type: 'email',
          defaultValue: 'hello@example.com',
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
