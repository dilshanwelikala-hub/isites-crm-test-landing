export type SectionKey = 'curated' | 'partner' | 'events'

export type LandingSection = {
  key: SectionKey
  label: string
  heading: string
  description?: string
}

export type LandingPackage = {
  id?: number | string
  title: string
  slug?: string
  category: SectionKey
  badge?: string
  priceLabel?: string
  duration?: string
  summary: string
  details?: string
  fallbackImageUrl?: string
  image?: {
    url?: string
    alt?: string
  }
  inclusions?: {
    item?: string
  }[]
  primaryAction?: {
    label?: string
    url?: string
  }
  secondaryAction?: {
    label?: string
    url?: string
  }
  site?: number | string | { id?: number | string; slug?: string }
}

export type LandingContent = {
  hero?: {
    eyebrow?: string
    title?: string
    description?: string
    ctaLabel?: string
    ctaUrl?: string
    fallbackImageUrl?: string
    image?: {
      url?: string
      alt?: string
    }
  }
  alert?: {
    label?: string
    text?: string
    linkLabel?: string
    linkUrl?: string
  }
  intro?: {
    eyebrow?: string
    heading?: string
    body?: string
  }
  stats?: {
    value?: string
    label?: string
  }[]
  sections?: LandingSection[]
  feature?: {
    eyebrow?: string
    heading?: string
    body?: string
    points?: {
      item?: string
    }[]
  }
  newsletter?: {
    eyebrow?: string
    heading?: string
    body?: string
    buttonLabel?: string
    buttonUrl?: string
  }
  footer?: {
    brand?: string
    address?: string
    phone?: string
    email?: string
  }
  seo?: {
    title?: string
    description?: string
  }
}

export const defaultContent: LandingContent = {
  hero: {
    eyebrow: 'Limited-Time Resort Offers',
    title: 'Packages & Experiences',
    description:
      'Curated stays, local partnerships, and seasonal events designed to make every visit feel effortless.',
    ctaLabel: 'Explore offers',
    ctaUrl: '#curated',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80',
  },
  alert: {
    label: 'New',
    text: 'Demo content is editable from the CMS and published directly to this page.',
    linkLabel: 'Open CMS',
    linkUrl: '/admin',
  },
  intro: {
    eyebrow: 'Packages & Experiences',
    heading: 'Choose the stay that fits the moment',
    body: 'From relaxed escapes to partner-led adventures, each offer is designed to make planning simple and the experience feel considered.',
  },
  stats: [
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
  sections: [
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
  feature: {
    eyebrow: 'Why book direct',
    heading: 'A simpler way to package the whole stay',
    body: 'The CMS separates page content from the design, so editors can publish polished offers without touching layout code.',
    points: [
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
  newsletter: {
    eyebrow: 'Newsletter',
    heading: 'Stay Connected',
    body: 'Keep up to date on the latest offers, events, and resort news.',
    buttonLabel: 'Sign up',
    buttonUrl: '#',
  },
  footer: {
    brand: 'The Test Resort',
    address: '70 Mountain Way, Essex, VT',
    phone: '802-878-1100',
    email: 'hello@example.com',
  },
  seo: {
    title: 'Packages & Experiences | Test Landing CMS',
    description:
      'A CMS-managed landing page for resort packages, partner experiences, and ticketed events.',
  },
}

export const defaultPackages: LandingPackage[] = [
  {
    title: 'Rise & Renew',
    slug: 'rise-and-renew',
    category: 'curated',
    badge: 'Spa Escape',
    priceLabel: 'From $429',
    duration: '2 nights',
    summary: 'A restorative escape with breakfast, spa time, and a slower start to the day.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1100&q=80',
    inclusions: [{ item: 'Daily breakfast' }, { item: 'Spa credit' }, { item: 'Late checkout' }],
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'The Signature Escape',
    slug: 'signature-escape',
    category: 'curated',
    badge: 'Most Popular',
    priceLabel: 'From $379',
    duration: 'Weekend',
    summary: 'A polished weekend package with dining credit and room to unwind.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1100&q=80',
    inclusions: [{ item: 'Dining credit' }, { item: 'Welcome amenity' }, { item: 'Flexible stay dates' }],
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'Romantic Getaway',
    slug: 'romantic-getaway',
    category: 'curated',
    badge: 'For Two',
    priceLabel: 'From $459',
    duration: '2 nights',
    summary: 'A thoughtful stay for two with quiet touches, dinner, and late checkout.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1501117716987-c8e1ecb2100f?auto=format&fit=crop&w=1100&q=80',
    inclusions: [{ item: 'Dinner for two' }, { item: 'Room upgrade when available' }],
    primaryAction: { label: 'Book now', url: '#' },
    secondaryAction: { label: 'View details', url: '#' },
  },
  {
    title: 'Above Reality',
    slug: 'above-reality',
    category: 'partner',
    badge: 'Partner Offer',
    priceLabel: 'Partner priced',
    duration: 'Half day',
    summary: 'Pair your stay with an unforgettable hot air balloon experience over open scenery.',
    details:
      'Book your stay through the resort, then reserve the flight directly with the partner operator.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1200&q=80',
    primaryAction: { label: 'Book your stay', url: '#' },
    secondaryAction: { label: 'Book your ride', url: '#' },
  },
  {
    title: 'Fish Tales',
    slug: 'fish-tales',
    category: 'partner',
    badge: 'Outdoor Guide',
    priceLabel: 'Call to arrange',
    duration: 'Custom',
    summary: 'A guided outdoor experience shaped around the way you like to fish.',
    details: 'Our team helps connect guests with a local guide for a tailored day on the water.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    primaryAction: { label: 'Call to book', url: 'tel:8028781100' },
    secondaryAction: { label: 'Experience details', url: '#' },
  },
  {
    title: 'Summer Concert Series',
    slug: 'summer-concert-series',
    category: 'events',
    badge: 'Seasonal',
    priceLabel: 'Ticketed',
    duration: 'Evening',
    summary: 'Preferred stay rates plus tickets when a partner performance lines up with your visit.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Learn more', url: '#' },
  },
  {
    title: 'Holiday Brunch',
    slug: 'holiday-brunch',
    category: 'events',
    badge: 'Dining Event',
    priceLabel: 'Ticketed',
    duration: 'Seasonal',
    summary: 'Seasonal dining events for families, friends, and special occasions.',
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1100&q=80',
    primaryAction: { label: 'Learn more', url: '#' },
  },
]
