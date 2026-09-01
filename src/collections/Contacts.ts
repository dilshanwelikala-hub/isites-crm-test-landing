import type { CollectionConfig } from 'payload'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    defaultColumns: ['name', 'email', 'phone', 'lifecycleStage', 'lastInquiryAt'],
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
      unique: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
      admin: {
        description: 'Optional company or group name for corporate, wedding, or event leads.',
      },
    },
    {
      name: 'lifecycleStage',
      type: 'select',
      defaultValue: 'lead',
      options: [
        {
          label: 'Lead',
          value: 'lead',
        },
        {
          label: 'Qualified Lead',
          value: 'qualified_lead',
        },
        {
          label: 'Customer',
          value: 'customer',
        },
        {
          label: 'Past Customer',
          value: 'past_customer',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'preferredChannel',
      type: 'select',
      defaultValue: 'email',
      options: [
        {
          label: 'Email',
          value: 'email',
        },
        {
          label: 'Phone',
          value: 'phone',
        },
        {
          label: 'Either',
          value: 'either',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'leadSource',
      type: 'select',
      defaultValue: 'website',
      options: [
        {
          label: 'Website',
          value: 'website',
        },
        {
          label: 'Manual Entry',
          value: 'manual',
        },
        {
          label: 'Referral',
          value: 'referral',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastInquiryAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
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
}
