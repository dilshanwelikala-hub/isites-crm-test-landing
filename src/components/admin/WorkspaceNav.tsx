import type { PayloadRequest, ServerProps, VisibleEntities } from 'payload'

import {
  siteCollectionHref,
  type WorkspaceNavItem,
  type WorkspaceNavSection,
} from '../../lib/adminNavigation'
import WorkspaceNavClient from './WorkspaceNav.client'
import { analyticsHref } from '../../lib/analytics'

type Props = ServerProps & { req?: PayloadRequest }

export default async function WorkspaceNav({
  payload,
  permissions,
  req,
  user,
  visibleEntities,
}: Props) {
  const canRead = (slug: VisibleEntities['collections'][number]) =>
    Boolean(visibleEntities?.collections.includes(slug) && permissions?.collections?.[slug]?.read)
  const canReadLandingPage = Boolean(
    visibleEntities?.globals.includes('landing-page') &&
    permissions?.globals?.['landing-page']?.read,
  )

  const siteItems: WorkspaceNavItem[] = []
  if (canRead('sites')) {
    siteItems.push({
      id: 'all-sites',
      label: 'All sites',
      href: '/admin/collections/sites',
    })
    if (permissions?.collections?.sites?.create) {
      siteItems.push({
        id: 'create-site',
        label: 'Create site',
        href: '/admin/collections/sites/create',
      })
    }
  }

  const contentLinks = (siteID?: number | string): WorkspaceNavItem[] => [
    ...(permissions?.collections?.['analytics-events']?.read &&
    permissions?.collections?.inquiries?.read
      ? [
          {
            id: `analytics-${siteID ?? 'default'}`,
            label: 'Analytics',
            href: analyticsHref(siteID),
          },
        ]
      : []),
    ...(siteID !== undefined || canReadLandingPage
      ? [
          {
            id: `landing-${siteID ?? 'default'}`,
            label: 'Landing page',
            href:
              siteID === undefined
                ? '/admin/globals/landing-page'
                : `/admin/collections/sites/${siteID}`,
          },
        ]
      : []),
    ...(['landing-packages', 'media'] as const).filter(canRead).map((slug) => ({
      id: `${slug}-${siteID ?? 'default'}`,
      label: slug === 'media' ? 'Media' : 'Packages',
      href: siteCollectionHref(slug, siteID),
    })),
  ]

  const defaultLinks = contentLinks()
  if (defaultLinks.length) {
    siteItems.push({
      id: 'default-site',
      label: 'Default site',
      children: defaultLinks,
    })
  }

  if (canRead('sites')) {
    try {
      const sites = await payload.find({
        collection: 'sites',
        depth: 0,
        draft: true,
        limit: 50,
        sort: 'name',
        select: { name: true },
        overrideAccess: false,
        req,
        user,
      })

      siteItems.push(
        ...sites.docs.map((site) => ({
          id: `site-${site.id}`,
          label: site.name || 'Untitled site',
          children: contentLinks(site.id),
        })),
      )

      if (sites.hasNextPage) {
        siteItems.push({
          id: 'more-sites',
          label: 'View all sites',
          href: '/admin/collections/sites',
        })
      }
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Unable to load sidebar sites.' })
    }
  }

  const crmItems = (['contacts', 'inquiries'] as const).filter(canRead).map((slug) => ({
    id: slug,
    label: slug === 'contacts' ? 'Contacts' : 'Inquiries',
    href: `/admin/collections/${slug}`,
  }))
  const sections: WorkspaceNavSection[] = [
    ...(siteItems.length
      ? [
          {
            id: 'cms' as const,
            label: 'CMS',
            children: [{ id: 'sites', label: 'Sites', children: siteItems }],
          },
        ]
      : []),
    ...(crmItems.length ? [{ id: 'crm' as const, label: 'CRM', children: crmItems }] : []),
    {
      id: 'settings',
      label: 'Settings',
      children: [
        ...(canRead('users')
          ? [{ id: 'users', label: 'Users', href: '/admin/collections/users' }]
          : []),
        { id: 'accounts', label: 'Accounts', href: '/admin/account' },
      ],
    },
  ]

  return <WorkspaceNavClient sections={sections} />
}
