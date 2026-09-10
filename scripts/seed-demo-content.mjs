import nextEnv from '@next/env'

nextEnv.loadEnvConfig(process.cwd())

const { getPayload } = await import('payload')
const { default: config } = await import('../payload.config.ts')
const { defaultContent, defaultPackages } = await import('../src/lib/landingDefaults.ts')

const payload = await getPayload({ config })
const day = 24 * 60 * 60 * 1000

function dateFromNow(days) {
  return new Date(Date.now() + days * day).toISOString()
}

await payload.updateGlobal({
  slug: 'landing-page',
  data: {
    ...defaultContent,
    _status: 'published',
  },
})

const siteSlug = 'test-resort'
const siteResult = await payload.find({
  collection: 'sites',
  limit: 1,
  where: {
    slug: {
      equals: siteSlug,
    },
  },
})
const siteData = {
  ...defaultContent,
  name: 'The Test Resort',
  slug: siteSlug,
  siteStatus: 'live',
  template: 'resort',
  primaryDomain: '',
  _status: 'published',
}
const demoSite = siteResult.docs[0]
  ? await payload.update({
      collection: 'sites',
      id: siteResult.docs[0].id,
      data: siteData,
      overrideAccess: true,
    })
  : await payload.create({
      collection: 'sites',
      data: siteData,
      overrideAccess: true,
    })

for (const [index, offer] of defaultPackages.entries()) {
  const existing = await payload.find({
    collection: 'landing-packages',
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: offer.slug,
          },
        },
        {
          site: {
            exists: false,
          },
        },
      ],
    },
  })

  const data = {
    ...offer,
    displayOrder: index + 1,
    featured: index < 3,
    _status: 'published',
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'landing-packages',
      id: existing.docs[0].id,
      data,
    })
  } else {
    await payload.create({
      collection: 'landing-packages',
      data,
    })
  }
}

for (const [index, offer] of defaultPackages.entries()) {
  const existing = await payload.find({
    collection: 'landing-packages',
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: offer.slug,
          },
        },
        {
          site: {
            equals: demoSite.id,
          },
        },
      ],
    },
  })

  const data = {
    ...offer,
    site: demoSite.id,
    displayOrder: index + 1,
    featured: index < 3,
    _status: 'published',
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'landing-packages',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'landing-packages',
      data,
      overrideAccess: true,
    })
  }
}

const demoInquiries = [
  {
    site: demoSite.id,
    name: 'Amelia Carter',
    email: 'amelia.carter@example.com',
    phone: '802-555-0174',
    company: 'Carter Family',
    packageSlug: 'rise-and-renew',
    packageTitle: 'Rise & Renew Escape',
    inquiryType: 'package_interest',
    guestCount: 2,
    message: 'We are interested in a relaxing two-night package next month.',
    status: 'new',
    priority: 'high',
    nextStep: 'reply_to_lead',
    followUpAt: dateFromNow(0),
    estimatedValue: 860,
    consentToContact: true,
    sourcePageUrl: `/sites/${siteSlug}/packages/rise-and-renew`,
  },
  {
    site: demoSite.id,
    name: 'Noah Bennett',
    email: 'noah.bennett@example.com',
    phone: '802-555-0138',
    company: 'Bennett Strategy Group',
    packageSlug: 'chef-for-a-day',
    packageTitle: 'Chef for a Day',
    inquiryType: 'group_booking',
    guestCount: 8,
    message: 'We are planning a small team experience and would like package details.',
    status: 'contacted',
    priority: 'normal',
    nextStep: 'send_package_details',
    followUpAt: dateFromNow(2),
    lastContactedAt: dateFromNow(-1),
    estimatedValue: 2400,
    consentToContact: true,
    sourcePageUrl: `/sites/${siteSlug}/packages/chef-for-a-day`,
  },
  {
    site: demoSite.id,
    name: 'Sophia Green',
    email: 'sophia.green@example.com',
    phone: '802-555-0199',
    packageSlug: 'garden-dinner-series',
    packageTitle: 'Garden Dinner Series',
    inquiryType: 'event_interest',
    guestCount: 4,
    message: 'Please send available dates and ticket pricing for the dinner series.',
    status: 'qualified',
    priority: 'high',
    nextStep: 'prepare_proposal',
    followUpAt: dateFromNow(1),
    estimatedValue: 720,
    consentToContact: true,
    sourcePageUrl: `/sites/${siteSlug}/packages/garden-dinner-series`,
  },
  {
    site: demoSite.id,
    name: 'Ethan Moore',
    email: 'ethan.moore@example.com',
    packageSlug: 'autumn-harvest-weekend',
    packageTitle: 'Autumn Harvest Weekend',
    inquiryType: 'package_interest',
    guestCount: 2,
    message: 'We are comparing weekend options and would like a quote.',
    status: 'proposal_sent',
    priority: 'normal',
    nextStep: 'waiting_for_response',
    followUpAt: dateFromNow(3),
    lastContactedAt: dateFromNow(-2),
    estimatedValue: 980,
    consentToContact: true,
    sourcePageUrl: `/sites/${siteSlug}/packages/autumn-harvest-weekend`,
  },
]

for (const inquiry of demoInquiries) {
  const existing = await payload.find({
    collection: 'inquiries',
    limit: 1,
    where: {
      and: [
        {
          site: {
            equals: demoSite.id,
          },
        },
        {
          email: {
            equals: inquiry.email,
          },
        },
        {
          packageSlug: {
            equals: inquiry.packageSlug,
          },
        },
      ],
    },
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'inquiries',
      id: existing.docs[0].id,
      data: inquiry,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'inquiries',
      data: inquiry,
      overrideAccess: true,
    })
  }
}

await payload.db.destroy?.()

console.log('Demo landing page content and sample leads seeded.')
