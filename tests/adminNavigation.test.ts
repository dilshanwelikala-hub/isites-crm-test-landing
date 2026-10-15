import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  hasActiveNavItem,
  isNavLinkActive,
  parseWorkspace,
  siteCollectionHref,
  workspaceForLocation,
  workspaceHref,
} from '../src/lib/adminNavigation'

test('workspace URLs preserve the selected dashboard across refresh', () => {
  for (const workspace of ['cms', 'crm', 'settings'] as const) {
    const url = new URL(workspaceHref(workspace), 'https://workspace.local')
    assert.equal(url.pathname, '/admin')
    assert.equal(workspaceForLocation(url.pathname, url.search), workspace)
    assert.equal(parseWorkspace(url.searchParams.get('workspace')), workspace)
  }
})

test('missing or malformed workspace selections safely default to CMS', () => {
  for (const value of [undefined, null, '', 'unknown', ['crm'], {}, '__proto__']) {
    assert.equal(parseWorkspace(value), 'cms')
  }
  assert.equal(workspaceForLocation('/admin', ''), 'cms')
})

test('collection and account links select their related workspace', () => {
  assert.equal(workspaceForLocation('/admin/collections/inquiries/12', ''), 'crm')
  assert.equal(workspaceForLocation('/admin/collections/contacts', ''), 'crm')
  assert.equal(workspaceForLocation('/admin/collections/users/create', ''), 'settings')
  assert.equal(workspaceForLocation('/admin/account', ''), 'settings')
  assert.equal(workspaceForLocation('/admin/collections/landing-packages', ''), 'cms')
  assert.equal(workspaceForLocation('/admin/collections/sites/12', ''), 'cms')
  assert.equal(workspaceForLocation('/admin/collections/media', ''), 'cms')
  assert.equal(workspaceForLocation('/admin/globals/landing-page', ''), 'cms')
})

test('site links keep different sites and the default site separate', () => {
  const first = siteCollectionHref('landing-packages', 12)
  const second = siteCollectionHref('landing-packages', 13)
  const defaultSite = siteCollectionHref('landing-packages')
  const search = new URL(first, 'https://workspace.local').search

  assert.equal(isNavLinkActive(first, '/admin/collections/landing-packages', search), true)
  assert.equal(isNavLinkActive(second, '/admin/collections/landing-packages', search), false)
  assert.equal(isNavLinkActive(defaultSite, '/admin/collections/landing-packages', search), false)
  assert.equal(
    new URL(defaultSite, 'https://workspace.local').searchParams.get('where[site][exists]'),
    'false',
  )
})

test('site identifiers are safely encoded in collection filters', () => {
  const link = new URL(siteCollectionHref('media', 'site & other=1'), 'https://workspace.local')
  assert.equal(link.searchParams.get('where[site][equals]'), 'site & other=1')
  assert.equal(link.searchParams.size, 1)
})

test('nested site content opens its ancestors without selecting other sites', () => {
  const sites = [12, 13].map((id) => ({
    id: `site-${id}`,
    label: `Site ${id}`,
    children: [{ id: `media-${id}`, label: 'Media', href: siteCollectionHref('media', id) }],
  }))
  const search = new URL(siteCollectionHref('media', 12), 'https://workspace.local').search
  assert.equal(
    hasActiveNavItem(
      { id: 'cms', label: 'CMS', children: sites },
      '/admin/collections/media',
      search,
    ),
    true,
  )
  assert.equal(hasActiveNavItem(sites[1], '/admin/collections/media', search), false)
})

test('editing a site highlights its landing page rather than the all-sites link', () => {
  assert.equal(
    isNavLinkActive('/admin/collections/sites', '/admin/collections/sites/12', ''),
    false,
  )
  assert.equal(
    isNavLinkActive('/admin/collections/sites/12', '/admin/collections/sites/12', ''),
    true,
  )
  assert.equal(
    isNavLinkActive('/admin/collections/sites/1', '/admin/collections/sites/12', ''),
    false,
  )
})

test('CRM details and account settings retain their navigation context', () => {
  assert.equal(
    isNavLinkActive('/admin/collections/contacts', '/admin/collections/contacts/5', ''),
    true,
  )
  assert.equal(isNavLinkActive('/admin/account', '/admin/account', ''), true)
  assert.equal(
    isNavLinkActive('/admin/collections/inquiries', '/admin/collections/contacts/5', ''),
    false,
  )
  assert.equal(isNavLinkActive('/admin', '/admin/account', ''), false)
})
