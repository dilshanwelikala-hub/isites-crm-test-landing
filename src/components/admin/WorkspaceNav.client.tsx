'use client'

import { NavHamburger, NavWrapper } from '@payloadcms/next/client'
import { Logout, useNav } from '@payloadcms/ui'
import {
  ChevronDown,
  BarChart3,
  ChevronRight,
  CircleUserRound,
  ContactRound,
  FileText,
  Globe,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  List,
  Package,
  Plus,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import {
  hasActiveNavItem,
  isNavLinkActive,
  workspaceForLocation,
  workspaceHref,
  type WorkspaceNavItem,
  type WorkspaceNavSection,
} from '../../lib/adminNavigation'

const itemIcons: Record<string, LucideIcon> = {
  cms: LayoutTemplate,
  crm: ContactRound,
  settings: Settings,
  sites: Globe,
  'all-sites': List,
  'more-sites': List,
  'create-site': Plus,
  'default-site': Globe,
  contacts: ContactRound,
  inquiries: Inbox,
  users: Users,
  accounts: CircleUserRound,
}

function getItemIcon(item: WorkspaceNavItem): LucideIcon {
  if (item.id.startsWith('analytics-')) return BarChart3
  if (itemIcons[item.id]) return itemIcons[item.id]
  if (item.href?.startsWith('/admin/collections/landing-packages')) return Package
  if (item.href?.startsWith('/admin/collections/media')) return Images
  return item.children ? Globe : FileText
}

function NavItem({
  item,
  pathname,
  search,
}: {
  item: WorkspaceNavItem
  pathname: string
  search: string
}) {
  const active = hasActiveNavItem(item, pathname, search)
  const [openOverride, setOpenOverride] = useState<boolean>()
  const open = openOverride ?? (active || item.id === 'sites')
  const Icon = getItemIcon(item)
  const Chevron = open ? ChevronDown : ChevronRight

  if (item.children) {
    return (
      <li className="workspace-nav__branch">
        <button
          aria-controls={`workspace-nav-${item.id}`}
          aria-expanded={open}
          className={`workspace-nav__toggle${active ? ' workspace-nav__toggle--active' : ''}`}
          onClick={() => setOpenOverride(!open)}
          type="button"
        >
          <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <span>{item.label}</span>
          <Chevron aria-hidden="true" focusable="false" strokeWidth={1.75} />
        </button>
        <ul hidden={!open} id={`workspace-nav-${item.id}`}>
          {item.children.map((child) => (
            <NavItem item={child} key={child.id} pathname={pathname} search={search} />
          ))}
        </ul>
      </li>
    )
  }

  const current = Boolean(item.href && isNavLinkActive(item.href, pathname, search))
  if (item.id.startsWith('analytics-')) {
    return (
      <li>
        <a
          aria-current={current ? 'page' : undefined}
          className="workspace-nav__link"
          href={item.href}
        >
          <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <span>{item.label}</span>
        </a>
      </li>
    )
  }
  return (
    <li>
      <Link
        aria-current={current ? 'page' : undefined}
        className="workspace-nav__link"
        href={item.href!}
        prefetch={false}
      >
        <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
        <span>{item.label}</span>
      </Link>
    </li>
  )
}

function NavSection({
  section,
  pathname,
  search,
  onNavigate,
}: {
  section: WorkspaceNavSection
  pathname: string
  search: string
  onNavigate?: () => void
}) {
  const selected = workspaceForLocation(pathname, search) === section.id
  const [open, setOpen] = useState(selected)
  const Icon = getItemIcon(section)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <li className="workspace-nav__branch workspace-nav__section">
      <div className="workspace-nav__section-heading" data-active={selected || undefined}>
        <a
          aria-current={selected && pathname === '/admin' ? 'page' : undefined}
          className="workspace-nav__link"
          href={workspaceHref(section.id)}
          onClick={onNavigate}
        >
          <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />
          <span>{section.label}</span>
        </a>
        <button
          aria-controls={`workspace-nav-${section.id}`}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${section.label} menu`}
          className="workspace-nav__section-toggle"
          onClick={() => setOpen(!open)}
          title={`${open ? 'Collapse' : 'Expand'} ${section.label} menu`}
          type="button"
        >
          <Chevron aria-hidden="true" focusable="false" size={16} strokeWidth={1.75} />
        </button>
      </div>
      <ul hidden={!open} id={`workspace-nav-${section.id}`}>
        {section.children?.map((item) => (
          <NavItem item={item} key={item.id} pathname={pathname} search={search} />
        ))}
      </ul>
    </li>
  )
}

export function WorkspaceNavMenu({
  sections,
  pathname,
  search,
  onNavigate,
}: {
  sections: WorkspaceNavSection[]
  pathname: string
  search: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Workspace" className="workspace-nav">
      <Link
        aria-current={
          pathname === '/admin' && !new URLSearchParams(search).has('workspace')
            ? 'page'
            : undefined
        }
        className="workspace-nav__link workspace-nav__home"
        href="/admin"
        onClick={onNavigate}
        prefetch={false}
      >
        <LayoutDashboard aria-hidden="true" focusable="false" strokeWidth={1.75} />
        <span>Dashboard</span>
      </Link>
      <ul>
        {sections.map((section) => (
          <NavSection
            section={section}
            key={`${section.id}-${pathname}-${search}`}
            pathname={pathname}
            search={search}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  )
}

export default function WorkspaceNavClient({ sections }: { sections: WorkspaceNavSection[] }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const { setNavOpen } = useNav()
  const onNavigate = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) setNavOpen(false)
  }

  return (
    <NavWrapper baseClass="nav">
      <div className="nav__wrap workspace-nav__wrap">
        <WorkspaceNavMenu
          sections={sections}
          pathname={pathname}
          search={search}
          onNavigate={onNavigate}
        />
        <div className="nav__controls">
          <Logout />
        </div>
      </div>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  )
}
