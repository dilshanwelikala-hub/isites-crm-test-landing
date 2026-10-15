export type Workspace = 'cms' | 'crm' | 'settings'

export function parseWorkspace(value: unknown): Workspace {
  return value === 'crm' || value === 'settings' ? value : 'cms'
}

export function workspaceHref(workspace: Workspace) {
  return `/admin?workspace=${workspace}`
}

export function workspaceForLocation(pathname: string, search: string): Workspace {
  if (pathname === '/admin') {
    return parseWorkspace(new URLSearchParams(search).get('workspace'))
  }
  if (
    ['/admin/collections/contacts', '/admin/collections/inquiries'].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return 'crm'
  if (
    ['/admin/collections/users', '/admin/account'].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return 'settings'
  return 'cms'
}

export type WorkspaceNavItem = {
  id: string
  label: string
  href?: string
  children?: WorkspaceNavItem[]
}

export type WorkspaceNavSection = WorkspaceNavItem & {
  id: Workspace
}

export function siteCollectionHref(collection: string, siteID?: number | string) {
  const query = new URLSearchParams(
    siteID === undefined
      ? { 'where[site][exists]': 'false' }
      : { 'where[site][equals]': String(siteID) },
  )

  return `/admin/collections/${collection}?${query}`
}

export function isNavLinkActive(href: string, pathname: string, search: string) {
  const target = new URL(href, 'https://workspace.local')
  const query = new URLSearchParams(search)
  const matchesPath =
    pathname === target.pathname ||
    (target.pathname !== '/admin' &&
      target.pathname !== '/admin/collections/sites' &&
      pathname.startsWith(`${target.pathname}/`))

  return (
    matchesPath && Array.from(target.searchParams).every(([key, value]) => query.get(key) === value)
  )
}

export function hasActiveNavItem(
  item: WorkspaceNavItem,
  pathname: string,
  search: string,
): boolean {
  return Boolean(
    (item.href && isNavLinkActive(item.href, pathname, search)) ||
    item.children?.some((child) => hasActiveNavItem(child, pathname, search)),
  )
}
