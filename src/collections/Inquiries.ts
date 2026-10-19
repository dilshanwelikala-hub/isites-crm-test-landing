import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'
import { trackingEnabled } from '../lib/analyticsCollection'
import {
  analyticsVisitor,
  excludedTrackingRequest,
  validVisitorID,
  verifyTrackingToken,
} from '../lib/analyticsServer'

const attributeAnalytics: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // Only verified website submissions may set attribution, never public REST fields.
  data.analyticsVisitor = operation === 'create' ? null : originalDoc?.analyticsVisitor
  data.analyticsPath = operation === 'create' ? null : originalDoc?.analyticsPath
  if (
    operation === 'update' &&
    data.site !== undefined &&
    relationshipID(data.site) !== relationshipID(originalDoc?.site)
  ) {
    data.analyticsVisitor = null
    data.analyticsPath = null
  }
  const input = data.analyticsInput
  delete data.analyticsInput
  if (
    operation !== 'create' ||
    req.user ||
    excludedTrackingRequest(req.headers) ||
    !input ||
    typeof input !== 'object'
  )
    return data
  const claims = verifyTrackingToken(input.token)
  if (
    !claims ||
    !validVisitorID(input.visitor) ||
    claims.site !== (relationshipID(data.site) ?? null)
  )
    return data
  try {
    if (await trackingEnabled(req.payload, claims.site)) {
      data.analyticsVisitor = analyticsVisitor(input.visitor, claims.site)
      data.analyticsPath = claims.path
    }
  } catch {
    req.payload.logger.warn(
      'Inquiry saved without analytics attribution because tracking is unavailable.',
    )
  }
  return data
}

function relationshipID(value: unknown) {
  if (value && typeof value === 'object' && 'id' in value) {
    return relationshipID((value as { id: unknown }).id)
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const connectInquiry: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data
  }

  const email = String(data.email || '')
    .trim()
    .toLowerCase()

  if (!email) {
    return data
  }

  const siteID = relationshipID(data.site)
  const contactWhere: Where = siteID
    ? {
        and: [
          {
            email: {
              equals: email,
            },
          },
          {
            site: {
              equals: siteID,
            },
          },
        ],
      }
    : {
        email: {
          equals: email,
        },
      }

  const contacts = await req.payload.find({
    collection: 'contacts',
    limit: 1,
    overrideAccess: true,
    where: contactWhere,
  })

  const contactData = {
    email,
    name: data.name,
    phone: data.phone,
    company: data.company,
    site: siteID,
    lastInquiryAt: new Date().toISOString(),
    lifecycleStage: 'lead' as const,
    preferredChannel: data.phone ? ('either' as const) : ('email' as const),
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
    const packageWhere: Where = siteID
      ? {
          and: [
            {
              slug: {
                equals: data.packageSlug,
              },
            },
            {
              site: {
                equals: siteID,
              },
            },
          ],
        }
      : {
          slug: {
            equals: data.packageSlug,
          },
        }

    const packages = await req.payload.find({
      collection: 'landing-packages',
      limit: 1,
      overrideAccess: true,
      where: packageWhere,
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
    defaultColumns: ['name', 'email', 'status', 'priority', 'nextStep', 'followUpAt'],
    group: 'CRM',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'analyticsInput',
      type: 'json',
      virtual: true,
      admin: { hidden: true },
      access: { read: () => false },
    },
    { name: 'analyticsVisitor', type: 'text', index: true, admin: { hidden: true } },
    { name: 'analyticsPath', type: 'text', admin: { readOnly: true }, label: 'Analytics page' },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      admin: {
        description: 'Website this inquiry belongs to.',
        position: 'sidebar',
      },
    },
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
      name: 'company',
      type: 'text',
      admin: {
        description: 'Optional company, family, wedding party, or group name.',
      },
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
      name: 'inquiryType',
      type: 'select',
      defaultValue: 'package_interest',
      options: [
        {
          label: 'Package Interest',
          value: 'package_interest',
        },
        {
          label: 'Event Interest',
          value: 'event_interest',
        },
        {
          label: 'Group Booking',
          value: 'group_booking',
        },
        {
          label: 'General Question',
          value: 'general_question',
        },
      ],
      admin: {
        description: 'Helps the team understand the type of request before replying.',
      },
    },
    {
      name: 'preferredDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Requested stay, event, or experience date if the visitor provided one.',
      },
    },
    {
      name: 'guestCount',
      type: 'number',
      admin: {
        description: 'Estimated number of guests or attendees.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'sourcePageUrl',
      type: 'text',
      admin: {
        description: 'Page where the inquiry was submitted.',
        readOnly: true,
      },
    },
    {
      name: 'consentToContact',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Visitor confirmed they can be contacted about this inquiry.',
      },
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
      name: 'nextStep',
      type: 'select',
      defaultValue: 'reply_to_lead',
      options: [
        {
          label: 'Reply to Lead',
          value: 'reply_to_lead',
        },
        {
          label: 'Send Package Details',
          value: 'send_package_details',
        },
        {
          label: 'Prepare Proposal',
          value: 'prepare_proposal',
        },
        {
          label: 'Waiting for Response',
          value: 'waiting_for_response',
        },
        {
          label: 'No Action Needed',
          value: 'no_action_needed',
        },
      ],
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
      name: 'lastContactedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'estimatedValue',
      type: 'number',
      admin: {
        description: 'Optional estimated booking value for prioritizing leads.',
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
    beforeChange: [attributeAnalytics, connectInquiry],
  },
}
