import * as fs from 'node:fs'
import * as path from 'node:path'
import { load } from './bon-ts/src/index.ts'

interface NavItem {
  text: string
  link?: string
  items?: NavItem[]
  // [key: string]: unknown
}

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  // [key: string]: unknown
}

interface BonConfig {
  nav?: NavItem[]
  sidebar?: Record<string, SidebarItem[]> | SidebarItem[]
}

interface BonData {
  nav: NavItem[]
  sidebar: Record<string, SidebarItem[]>
}

function joinPath(prefix: string, link: string): string {
  if (link.startsWith('/')) {
    return prefix.endsWith('/') ? prefix.slice(0, -1) + link : prefix + link
  }
  return prefix + link
}

function prefixLinks(items: NavItem[], prefix: string): NavItem[] {
  return items.map(item => ({
    ...item,
    link: item.link ? joinPath(prefix, item.link) : item.link,
    items: item.items ? prefixLinks(item.items, prefix) : undefined,
    _bonPrefix: prefix,
  }))
}

function prefixSidebar(
  sidebar: Record<string, SidebarItem[]> | SidebarItem[],
  prefix: string,
): Record<string, SidebarItem[]> {
  const result: Record<string, SidebarItem[]> = {}

  function prefixItems(items: SidebarItem[]): SidebarItem[] {
    return items.map(item => ({
      ...item,
      link: item.link ? joinPath(prefix, item.link) : undefined,
      items: item.items ? prefixItems(item.items) : undefined,
    }))
  }

  if (Array.isArray(sidebar)) {
    result[prefix] = prefixItems(sidebar)
  } else {
    for (const [key, items] of Object.entries(sidebar)) {
      result[joinPath(prefix, key)] = prefixItems(items)
    }
  }

  return result
}

function findBonFiles(dir: string, root: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.vitepress') continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(...findBonFiles(fullPath, root))
    } else if (entry.name === 'config.bon') {
      results.push(fullPath)
    }
  }

  return results
}

export function loadBonConfigs(): BonData {
  const root = process.cwd()
  const bonFiles = findBonFiles(root, root)

  const mergedNav: NavItem[] = []
  const mergedSidebar: Record<string, SidebarItem[]> = {}

  for (const file of bonFiles) {
    const relativeDir = path.relative(root, path.dirname(file))
    const prefix = relativeDir ? '/' + relativeDir.replace(/\\/g, '/') + '/' : '/'

    const config = load(file) as BonConfig

    if (config.nav) {
      mergedNav.push(...prefixLinks(config.nav, prefix))
    }

    if (config.sidebar) {
      const prefixed = prefixSidebar(config.sidebar, prefix)
      Object.assign(mergedSidebar, prefixed)
    }
  }

  return { nav: mergedNav, sidebar: mergedSidebar }
}
