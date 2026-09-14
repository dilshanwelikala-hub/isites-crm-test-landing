import { defaultContent, type LandingContent } from './landingDefaults'

export type SiteTemplateKey = 'resort' | 'restaurant' | 'event' | 'service'

export type SiteTemplate = {
  bestFor: string
  content: LandingContent
  key: SiteTemplateKey
  label: string
  summary: string
  theme: {
    accentColor: string
    primaryColor: string
  }
}

const resortTemplate: SiteTemplate = {
  key: 'resort',
  label: 'Resort / Hotel',
  summary: 'Packages, experiences, seasonal offers, and direct booking inquiries.',
  bestFor: 'Hotels, resorts, retreats, villas, and hospitality offers.',
  theme: {
    primaryColor: '#314339',
    accentColor: '#c09b5f',
  },
  content: defaultContent,
}

export const siteTemplates: SiteTemplate[] = [
  resortTemplate,
  {
    key: 'restaurant',
    label: 'Restaurant',
    summary: 'Menus, private dining, events, and table or group inquiries.',
    bestFor: 'Restaurants, cafes, bars, chef concepts, and private dining teams.',
    theme: {
      primaryColor: '#33231f',
      accentColor: '#c95f3f',
    },
    content: {
      ...defaultContent,
      hero: {
        eyebrow: 'Seasonal Dining',
        title: 'Menus, Events & Private Dining',
        description:
          'Showcase signature menus, chef-led experiences, and private dining offers in one editable site.',
        ctaLabel: 'Explore menus',
        ctaUrl: '#curated',
        fallbackImageUrl:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80',
      },
      intro: {
        eyebrow: 'Dining Experiences',
        heading: 'Make every dining moment easy to choose',
        body: 'Highlight menus, group packages, ticketed dining events, and private room options without changing the site design.',
      },
      sections: [
        {
          key: 'curated',
          label: 'Menus',
          heading: 'Featured Menus',
          description: 'Seasonal menus, tasting options, brunches, and signature dining offers.',
        },
        {
          key: 'partner',
          label: 'Private Dining',
          heading: 'Private Dining & Group Experiences',
          description: 'Packages for celebrations, corporate dinners, and chef-led group bookings.',
        },
        {
          key: 'events',
          label: 'Events',
          heading: 'Upcoming Dining Events',
          description: 'Ticketed dinners, chef tables, holiday menus, and special events.',
        },
      ],
      feature: {
        eyebrow: 'Why reserve direct',
        heading: 'A simpler way to manage dining demand',
        body: 'Editors can keep menus current, publish events quickly, and route new inquiries into the CRM pipeline.',
        points: [
          { item: 'Editable menus and private dining offers' },
          { item: 'Inquiry tracking for events and group requests' },
          { item: 'Media-ready layout for food and venue photography' },
        ],
      },
      newsletter: {
        eyebrow: 'Updates',
        heading: 'New Menus & Events',
        body: 'Share seasonal menus, special dinners, and private dining updates.',
        buttonLabel: 'Join the list',
        buttonUrl: '#',
      },
      footer: {
        brand: 'The Test Restaurant',
        address: '12 Market Street',
        phone: '555-0100',
        email: 'hello@example.com',
      },
      seo: {
        title: 'Menus & Private Dining | Restaurant CMS',
        description: 'A CMS-managed restaurant site for menus, private dining, events, and inquiries.',
      },
    },
  },
  {
    key: 'event',
    label: 'Event / Venue',
    summary: 'Venue spaces, event packages, ticketed events, and inquiry capture.',
    bestFor: 'Wedding venues, event spaces, conference venues, and seasonal event programs.',
    theme: {
      primaryColor: '#242c3f',
      accentColor: '#8ea7ff',
    },
    content: {
      ...defaultContent,
      hero: {
        eyebrow: 'Venue & Events',
        title: 'Spaces, Packages & Event Inquiries',
        description:
          'Present event spaces, planning packages, and upcoming ticketed events with a built-in inquiry workflow.',
        ctaLabel: 'Explore spaces',
        ctaUrl: '#curated',
        fallbackImageUrl:
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1800&q=80',
      },
      intro: {
        eyebrow: 'Plan the Moment',
        heading: 'Turn event interest into organized follow-up',
        body: 'Give visitors clear event options and help the internal team track every inquiry by stage.',
      },
      sections: [
        {
          key: 'curated',
          label: 'Spaces',
          heading: 'Featured Venue Spaces',
          description: 'Showcase ceremony areas, meeting rooms, reception halls, and flexible venues.',
        },
        {
          key: 'partner',
          label: 'Packages',
          heading: 'Planning Packages',
          description: 'Group event packages, catering options, and partner-led planning experiences.',
        },
        {
          key: 'events',
          label: 'Events',
          heading: 'Ticketed Events',
          description: 'Public events, seasonal programs, workshops, and venue showcases.',
        },
      ],
      feature: {
        eyebrow: 'Event pipeline',
        heading: 'Keep planning inquiries moving',
        body: 'The site captures event details and keeps sales or planning teams focused on the next follow-up.',
        points: [
          { item: 'Inquiry capture for venue and package interest' },
          { item: 'Lead stages for planning and proposal follow-up' },
          { item: 'Editable event sections for seasonal updates' },
        ],
      },
      newsletter: {
        eyebrow: 'Events',
        heading: 'Upcoming Events',
        body: 'Share venue news, showcases, and ticketed event updates.',
        buttonLabel: 'Get updates',
        buttonUrl: '#',
      },
      footer: {
        brand: 'The Test Venue',
        address: '40 Garden Avenue',
        phone: '555-0110',
        email: 'events@example.com',
      },
      seo: {
        title: 'Venue Spaces & Event Packages | Event CMS',
        description: 'A CMS-managed event venue site for spaces, packages, ticketed events, and inquiries.',
      },
    },
  },
  {
    key: 'service',
    label: 'Service Business',
    summary: 'Services, consultation offers, case-style sections, and lead capture.',
    bestFor: 'Consultants, agencies, wellness providers, local service teams, and B2B services.',
    theme: {
      primaryColor: '#20343c',
      accentColor: '#47b6a0',
    },
    content: {
      ...defaultContent,
      hero: {
        eyebrow: 'Services',
        title: 'Services, Packages & Consultation Requests',
        description:
          'Present services clearly and turn visitor interest into organized CRM follow-up.',
        ctaLabel: 'View services',
        ctaUrl: '#curated',
        fallbackImageUrl:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80',
      },
      intro: {
        eyebrow: 'How We Help',
        heading: 'Package services so clients can act faster',
        body: 'Group service offers, explain outcomes, and capture new business inquiries from one CMS-managed site.',
      },
      sections: [
        {
          key: 'curated',
          label: 'Services',
          heading: 'Core Service Packages',
          description: 'Consultations, retainers, audits, and focused service packages.',
        },
        {
          key: 'partner',
          label: 'Solutions',
          heading: 'Specialist Solutions',
          description: 'Add-ons, partner services, and tailored client engagements.',
        },
        {
          key: 'events',
          label: 'Workshops',
          heading: 'Workshops & Sessions',
          description: 'Ticketed sessions, webinars, training days, and seasonal programs.',
        },
      ],
      feature: {
        eyebrow: 'Lead management',
        heading: 'A practical path from interest to follow-up',
        body: 'Capture service inquiries, track priority, and keep every follow-up visible in the CRM dashboard.',
        points: [
          { item: 'Editable service package sections' },
          { item: 'CRM stages for new and qualified leads' },
          { item: 'Contact records created from every inquiry' },
        ],
      },
      newsletter: {
        eyebrow: 'Insights',
        heading: 'Stay in Touch',
        body: 'Share service updates, resources, and workshop announcements.',
        buttonLabel: 'Subscribe',
        buttonUrl: '#',
      },
      footer: {
        brand: 'The Test Service Co.',
        address: '100 Business Road',
        phone: '555-0120',
        email: 'hello@example.com',
      },
      seo: {
        title: 'Services & Consultation Requests | Service CMS',
        description: 'A CMS-managed service business site for packages, solutions, workshops, and leads.',
      },
    },
  },
]

export function getSiteTemplate(value?: string | null) {
  return siteTemplates.find((template) => template.key === value) || resortTemplate
}

export function getTemplateLabel(value?: string | null) {
  return getSiteTemplate(value).label
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === ''
}

function shouldReplace(currentValue: unknown, baselineValue: unknown) {
  if (isEmpty(currentValue)) {
    return true
  }

  return JSON.stringify(currentValue) === JSON.stringify(baselineValue)
}

function mergeGroup(
  currentValue: Record<string, unknown> | undefined,
  baselineValue: Record<string, unknown> | undefined,
  templateValue: Record<string, unknown> | undefined,
) {
  const nextValue = { ...(currentValue || {}) }

  Object.entries(templateValue || {}).forEach(([key, value]) => {
    if (shouldReplace(nextValue[key], baselineValue?.[key])) {
      nextValue[key] = value
    }
  })

  return nextValue
}

export function applySiteTemplateDefaults<TData extends Record<string, unknown>>(data: TData) {
  const template = getSiteTemplate(typeof data.template === 'string' ? data.template : undefined)
  const nextData: Record<string, unknown> = {
    ...data,
    template: template.key,
  }

  if (shouldReplace(nextData.theme, undefined)) {
    nextData.theme = template.theme
  } else {
    nextData.theme = mergeGroup(
      nextData.theme as Record<string, unknown>,
      undefined,
      template.theme,
    )
  }

  ;(['hero', 'alert', 'intro', 'feature', 'newsletter', 'footer', 'seo'] as const).forEach((key) => {
    nextData[key] = mergeGroup(
      nextData[key] as Record<string, unknown> | undefined,
      defaultContent[key] as Record<string, unknown> | undefined,
      template.content[key] as Record<string, unknown> | undefined,
    )
  })

  ;(['stats', 'sections'] as const).forEach((key) => {
    if (shouldReplace(nextData[key], defaultContent[key])) {
      nextData[key] = template.content[key]
    }
  })

  return nextData as TData
}
