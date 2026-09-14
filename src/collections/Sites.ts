import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { defaultContent } from '../lib/landingDefaults'
import { applySiteTemplateDefaults } from '../lib/siteTemplates'
import { getSiteURL } from '../lib/siteURL'

function previewToken() {
  return process.env.PREVIEW_SECRET || process.env.PAYLOAD_SECRET
}

const applyTemplateDefaults: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation !== 'create' || !data) {
    return data
  }

  return applySiteTemplateDefaults(data)
}

export const Sites: CollectionConfig = {
  slug: 'sites',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    defaultColumns: ['name', 'slug', 'template', 'siteStatus', '_status'],
    group: 'Sites',
    preview: (doc) => {
      const token = previewToken()

      if (!token || typeof doc.slug !== 'string') {
        return null
      }

      return `${getSiteURL()}/sites/${doc.slug}?preview=true&previewToken=${encodeURIComponent(token)}`
    },
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Public URL path for this site, for example test-resort.',
      },
    },
    {
      name: 'siteStatus',
      type: 'text',
      defaultValue: 'live',
      admin: {
        description: 'Use live, draft, or archived.',
        position: 'sidebar',
      },
    },
    {
      name: 'template',
      type: 'text',
      defaultValue: 'resort',
      admin: {
        description:
          'Choose the starter content type: resort, restaurant, event, or service. Applied when a site is first created.',
        position: 'sidebar',
      },
    },
    {
      name: 'primaryDomain',
      type: 'text',
      admin: {
        description: 'Future custom domain for this site, for example clientsite.com.',
        position: 'sidebar',
      },
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'primaryColor',
          type: 'text',
          defaultValue: '#314339',
        },
        {
          name: 'accentColor',
          type: 'text',
          defaultValue: '#c09b5f',
        },
      ],
    },
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: defaultContent.hero?.eyebrow,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          defaultValue: defaultContent.hero?.title,
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: defaultContent.hero?.description,
        },
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: defaultContent.hero?.ctaLabel,
        },
        {
          name: 'ctaUrl',
          type: 'text',
          defaultValue: defaultContent.hero?.ctaUrl,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'fallbackImageUrl',
          type: 'text',
          defaultValue: defaultContent.hero?.fallbackImageUrl,
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
          defaultValue: defaultContent.alert?.label,
        },
        {
          name: 'text',
          type: 'text',
          defaultValue: defaultContent.alert?.text,
        },
        {
          name: 'linkLabel',
          type: 'text',
          defaultValue: defaultContent.alert?.linkLabel,
        },
        {
          name: 'linkUrl',
          type: 'text',
          defaultValue: defaultContent.alert?.linkUrl,
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
          defaultValue: defaultContent.intro?.eyebrow,
        },
        {
          name: 'heading',
          type: 'text',
          defaultValue: defaultContent.intro?.heading,
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue: defaultContent.intro?.body,
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
      defaultValue: defaultContent.stats,
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
      defaultValue: defaultContent.sections,
    },
    {
      name: 'feature',
      type: 'group',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: defaultContent.feature?.eyebrow,
        },
        {
          name: 'heading',
          type: 'text',
          defaultValue: defaultContent.feature?.heading,
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue: defaultContent.feature?.body,
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
          defaultValue: defaultContent.feature?.points,
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
          defaultValue: defaultContent.newsletter?.eyebrow,
        },
        {
          name: 'heading',
          type: 'text',
          defaultValue: defaultContent.newsletter?.heading,
        },
        {
          name: 'body',
          type: 'textarea',
          defaultValue: defaultContent.newsletter?.body,
        },
        {
          name: 'buttonLabel',
          type: 'text',
          defaultValue: defaultContent.newsletter?.buttonLabel,
        },
        {
          name: 'buttonUrl',
          type: 'text',
          defaultValue: defaultContent.newsletter?.buttonUrl,
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
          defaultValue: defaultContent.footer?.brand,
        },
        {
          name: 'address',
          type: 'text',
          defaultValue: defaultContent.footer?.address,
        },
        {
          name: 'phone',
          type: 'text',
          defaultValue: defaultContent.footer?.phone,
        },
        {
          name: 'email',
          type: 'email',
          defaultValue: defaultContent.footer?.email,
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
          defaultValue: defaultContent.seo?.title,
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: defaultContent.seo?.description,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [applyTemplateDefaults],
  },
  versions: {
    drafts: true,
  },
}
