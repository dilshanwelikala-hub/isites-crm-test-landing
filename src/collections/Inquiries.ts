import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

const connectInquiry: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data
  }

  const email = String(data.email || '').trim().toLowerCase()

  if (!email) {
    return data
  }

  const contacts = await req.payload.find({
    collection: 'contacts',
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const contactData = {
    email,
    name: data.name,
    phone: data.phone,
    lastInquiryAt: new Date().toISOString(),
    leadSource: 'website' as const,
  }

  const contact =
    contacts.docs[0] ||
    (await req.payload.create({
      collection: 'contacts',
      data: contactData,
      overrideAccess: true,
    }))

  if (contacts.docs[0]) {
    await req.payload.update({
      collection: 'contacts',
      id: contacts.docs[0].id,
      data: contactData,
      overrideAccess: true,
    })
  }

  if (contact?.id) {
    data.contact = contact.id
  }

  if (data.packageSlug && !data.package) {
    const packages = await req.payload.find({
      collection: 'landing-packages',
      limit: 1,
      overrideAccess: true,
      where: {
        slug: {
          equals: data.packageSlug,
        },
      },
    })

    if (packages.docs[0]?.id) {
      data.package = packages.docs[0].id
    }
  }

  return data
}

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  access: {
    create: () => true,
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    defaultColumns: ['name', 'email', 'status', 'priority', 'followUpAt'],
    group: 'Lead Management',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'contact',
      type: 'relationship',
      relationTo: 'contacts',
      admin: {
        description: 'Automatically linked or created from the inquiry email.',
        readOnly: true,
      },
    },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'landing-packages',
      admin: {
        description: 'Package this person asked about.',
      },
    },
    {
      name: 'packageSlug',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'packageTitle',
      type: 'text',
      admin: {
        description: 'Filled automatically when a visitor inquires from a package page.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'Contacted',
          value: 'contacted',
        },
        {
          label: 'Qualified',
          value: 'qualified',
        },
        {
          label: 'Proposal Sent',
          value: 'proposal_sent',
        },
        {
          label: 'Won',
          value: 'won',
        },
        {
          label: 'Lost',
          value: 'lost',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Normal',
          value: 'normal',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'assignedOwner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'followUpAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'internalNotes',
      type: 'array',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [connectInquiry],
  },
}
