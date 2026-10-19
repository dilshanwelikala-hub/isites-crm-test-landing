import type { CollectionConfig } from 'payload'

export const AnalyticsEvents: CollectionConfig = {
  slug: 'analytics-events',
  admin: { hidden: true },
  access: {
    create: () => false,
    read: ({ req: { user } }) => Boolean(user),
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'eventID', type: 'text', required: true, unique: true },
    { name: 'pageKey', type: 'text', required: true, index: true },
    { name: 'site', type: 'relationship', relationTo: 'sites', index: true },
    { name: 'eventType', type: 'text', required: true },
    { name: 'path', type: 'text', required: true },
    { name: 'visitor', type: 'text', required: true },
    { name: 'action', type: 'text' },
    { name: 'referrer', type: 'text' },
  ],
  indexes: [{ fields: ['site', 'createdAt'] }],
}
