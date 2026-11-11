import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MenuItem, MenuTreeNode, AppModule } from '@/types/menu.types'
import { PermissionTypeEnum } from '@/constants/options'

const iconDefinitions = LucideIcons as unknown as Record<string, LucideIcon>

const VI_LANGUAGE_PREFIX = 'vi'

export function getMenuDisplayName(
    menu: Pick<MenuItem, 'MenuName' | 'ForeignName' | 'Url'> & Partial<Pick<MenuItem, 'PathFolder'>>,
    language: string | undefined,
    currentUrl?: string,
): string {
    const lang = (language ?? 'vi').toLowerCase().split('-')[0] ?? 'vi'

    if (menu.Url?.includes('{mode}') && currentUrl) {
        const mode = resolveModeFromMenuUrl(menu.Url, currentUrl)

        if (mode) {
            const modeMap: Record<string, Record<string, string>> = {
                vi: {
                    view: 'Chi tiết',
                    add: 'Thêm mới',
                    edit: 'Cập nhật',
                    approve: 'Phê duyệt',
                },
                en: {
                    view: 'Detail',
                    add: 'Add New',
                    edit: 'Update',
                    approve: 'Approve',
                },
            }
            const trans = modeMap[lang] || modeMap['vi']
            if (trans[mode]) {
                return trans[mode]
            }
        }
    }

    const primary = menu.MenuName ?? ''
    if (lang === VI_LANGUAGE_PREFIX) {
        return primary
    }
    const foreign = menu.ForeignName?.trim()
    return foreign && foreign.length > 0 ? foreign : primary
}

export function buildMenuTree(items: MenuItem[], parentCode: string = '0', level: number = 0): MenuTreeNode[] {
    const filtered = items.filter(item => item.ParentCode === parentCode)

    return filtered
        .sort((a, b) => Number(a.OrderNo) - Number(b.OrderNo))
        .map(item => {
            const children = buildMenuTree(items, item.MenuCode, level + 1)

            return {
                ...item,
                level,
                children,
                isExpanded: false,
            }
        })
}

export function filterMenuByPermission(nodes: MenuTreeNode[]): MenuTreeNode[] {
    const filtered = nodes
        .filter(node => {
            if (node.Status !== 'A') {
                return false
            }

            return true
        })
        .map(node => ({
            ...node,
            children: filterMenuByPermission(node.children),
        }))
        .filter(node => {
            if (node.ModuleType === PermissionTypeEnum.GROUP || node.ModuleType === PermissionTypeEnum.MODULE) {
                const hasChildren = node.children.length > 0
                return hasChildren
            }
            return true
        })

    return filtered
}

export function groupMenusByApp(nodes: MenuTreeNode[]): { appCode: string; icon: string; menus: MenuTreeNode[] }[] {
    const grouped = new Map<string, MenuTreeNode[]>()

    nodes.forEach(node => {
        if (!grouped.has(node.AppCode)) {
            grouped.set(node.AppCode, [])
        }
        grouped.get(node.AppCode)!.push(node)
    })

    return Array.from(grouped.entries()).map(([appCode, menus]) => ({
        appCode,
        icon: getAppIcon(appCode),
        menus,
    }))
}

export function findMenuByCode(nodes: MenuTreeNode[], menuCode: string): MenuTreeNode | null {
    for (const node of nodes) {
        if (node.MenuCode === menuCode) return node

        if (node.children.length > 0) {
            const found = findMenuByCode(node.children, menuCode)
            if (found) return found
        }
    }
    return null
}

export function stripBasePath(url: string): string {
    const base = import.meta.env.FIS_PUBLIC_URL || '/'
    const normalizedBase = base.length > 1 && base.endsWith('/') ? base.slice(0, -1) : base

    if (url.startsWith(normalizedBase)) {
        const stripped = url.slice(normalizedBase.length)
        return stripped.startsWith('/') ? stripped : '/' + stripped
    }
    return url
}

export function normalizeMenuFolder(path?: string | null): string {
    return (path ?? '').replace(/^\.?\//, '').toLowerCase()
}

const MODE_PLACEHOLDER_NAME = 'mode'
const MODE_PLACEHOLDER_VALUES = new Set(['view', 'edit', 'add', 'approve'])

const normalizeRoutePath = (path: string) => {
    const stripped = stripBasePath(path).split('?')[0]
    const noTrailing = stripped.length > 1 && stripped.endsWith('/') ? stripped.slice(0, -1) : stripped
    return noTrailing.startsWith('/') ? noTrailing.slice(1) : noTrailing
}

export const normalizeRoutePathForMatch = normalizeRoutePath

const resolveModeFromMenuUrl = (menuUrl: string | null | undefined, currentUrl: string): string | null => {
    if (!menuUrl?.includes('{mode}')) {
        return null
    }

    const patternParts = menuUrl.split('/').filter(Boolean)
    const urlParts = normalizeRoutePath(currentUrl).split('/').filter(Boolean)
    const modeIndex = patternParts.findIndex(part => part === '{mode}')

    if (modeIndex === -1) {
        return null
    }

    const mode = urlParts[modeIndex]?.toLowerCase()

    if (!mode || !MODE_PLACEHOLDER_VALUES.has(mode)) {
        return null
    }

    return mode
}

const isPlaceholderPart = (part: string) => part.startsWith('{') && part.endsWith('}')

const getPlaceholderName = (part: string) => part.slice(1, -1)

const doesPlaceholderValueMatch = (placeholderName: string, value: string) => {
    if (placeholderName === MODE_PLACEHOLDER_NAME) {
        return MODE_PLACEHOLDER_VALUES.has(value.toLowerCase())
    }

    return value.length > 0
}

export function getUrlMatchScore(pattern: string | null, url: string): number {
    if (!pattern) return -1

    const normalizedPattern = normalizeRoutePath(pattern)
    const normalizedUrl = normalizeRoutePath(url)

    if (normalizedPattern === normalizedUrl) {
        return Number.MAX_SAFE_INTEGER
    }

    const patternParts = normalizedPattern.split('/').filter(Boolean)
    const urlParts = normalizedUrl.split('/').filter(Boolean)

    if (patternParts.length !== urlParts.length) {
        return -1
    }

    let literalScore = 0

    for (let index = 0; index < patternParts.length; index += 1) {
        const part = patternParts[index]
        const urlPart = urlParts[index]

        if (isPlaceholderPart(part)) {
            if (!doesPlaceholderValueMatch(getPlaceholderName(part), urlPart)) {
                return -1
            }
            continue
        }

        if (part !== urlPart) {
            return -1
        }

        literalScore += 1
    }

    return literalScore
}

export function isUrlMatch(pattern: string | null, url: string): boolean {
    return getUrlMatchScore(pattern, url) >= 0
}

export function findBestMenuByUrl<T extends { Url: string | null }>(menus: T[], url: string): T | null {
    let bestMatch: T | null = null
    let bestScore = -1

    for (const menu of menus) {
        const score = getUrlMatchScore(menu.Url, url)
        if (score > bestScore) {
            bestScore = score
            bestMatch = menu
        }
    }

    return bestMatch
}

const collectPatternMenuMatches = (
    nodes: MenuTreeNode[],
    url: string,
    matches: MenuTreeNode[] = [],
): MenuTreeNode[] => {
    for (const node of nodes) {
        if (isUrlMatch(node.Url, url)) {
            matches.push(node)
        }

        if (node.children.length > 0) {
            collectPatternMenuMatches(node.children, url, matches)
        }
    }

    return matches
}

export function findMenuByUrl(nodes: MenuTreeNode[], url: string): MenuTreeNode | null {
    const normalizedUrl = normalizeRoutePath(url)

    for (const node of nodes) {
        if (node.Url && normalizeRoutePath(node.Url) === normalizedUrl) {
            return node
        }

        if (node.children.length > 0) {
            const found = findMenuByUrl(node.children, normalizedUrl)
            if (found && found.Url && normalizeRoutePath(found.Url) === normalizedUrl) {
                return found
            }
        }
    }

    const patternMatches = collectPatternMenuMatches(nodes, normalizedUrl)
    return findBestMenuByUrl(patternMatches, normalizedUrl)
}

export function getBreadcrumbs(nodes: MenuTreeNode[], menuCode: string, path: MenuTreeNode[] = []): MenuTreeNode[] {
    for (const node of nodes) {
        if (node.MenuCode === menuCode) {
            return [...path, node]
        }

        if (node.children.length > 0) {
            const found = getBreadcrumbs(node.children, menuCode, [...path, node])
            if (found.length > 0) return found
        }
    }
    return []
}

export function getParentCodes(items: MenuItem[], menuCode: string, parents: string[] = []): string[] {
    const item = items.find(i => i.MenuCode === menuCode)
    if (!item || item.ParentCode === '0') return parents

    return getParentCodes(items, item.ParentCode, [item.ParentCode, ...parents])
}

export function flattenMenuTree(nodes: MenuTreeNode[]): MenuTreeNode[] {
    return nodes.reduce<MenuTreeNode[]>((acc, node) => {
        return [...acc, node, ...flattenMenuTree(node.children)]
    }, [])
}

export function hasMenuPermission(menu: MenuTreeNode | null, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    if (!menu) return false

    if (menu.ModuleType === PermissionTypeEnum.FUNCTION) {
        return menu.IsUserPermission
    }

    if (menu.ModuleType === PermissionTypeEnum.MENU) {
        return menu.IsUserPermission
    }

    return false
}

function getAppIcon(appCode: string): string {
    const appIcons: Record<string, string> = {
        APP: 'Settings',
        CRM: 'Users',
        HRM: 'UserCog',
        FIN: 'DollarSign',
    }
    return appIcons[appCode] || 'Folder'
}

export function searchMenus(nodes: MenuTreeNode[], keyword: string): MenuTreeNode[] {
    const lowerKeyword = keyword.toLowerCase()
    const results: MenuTreeNode[] = []

    function search(items: MenuTreeNode[]) {
        items.forEach(item => {
            if (
                item.MenuName?.toLowerCase().includes(lowerKeyword) ||
                item.ForeignName?.toLowerCase().includes(lowerKeyword) ||
                item.MenuCode?.toLowerCase().includes(lowerKeyword) ||
                item.Url?.toLowerCase().includes(lowerKeyword)
            ) {
                results.push(item)
            }

            if (item.children.length > 0) {
                search(item.children)
            }
        })
    }

    search(nodes)
    return results
}

export function getDefaultExpandedCodes(nodes: MenuTreeNode[], currentUrl: string): string[] {
    const menu = findMenuByUrl(nodes, currentUrl)
    if (!menu) return []

    const items = flattenMenuTree(nodes)
    const parentCodes = getParentCodes(
        items.map(n => ({ ...n }) as MenuItem),
        menu.MenuCode,
    )

    return parentCodes
}

const ICON_CACHE = new Map<string, React.FC<any> | undefined>()

const toPascalCase = (str: string) => {
    if (!str) return ''
    return str
        .split(/[-_]/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}

export function getIconComponent(iconName: string | null): React.FC<any> | undefined {
    if (!iconName) return undefined

    if (ICON_CACHE.has(iconName)) {
        return ICON_CACHE.get(iconName)
    }

    const trimmed = iconName.trim()
    if (!trimmed) return undefined

    const candidates = new Set<string>()
    candidates.add(trimmed)
    candidates.add(toPascalCase(trimmed))

    const withoutSuffix = trimmed.replace(/Icon$/i, '')
    if (withoutSuffix !== trimmed) {
        candidates.add(withoutSuffix)
        candidates.add(toPascalCase(withoutSuffix))
    }

    candidates.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1))

    let component: React.FC<any> | undefined
    for (const candidate of candidates) {
        if (iconDefinitions[candidate]) {
            component = iconDefinitions[candidate] as React.FC<any>
            break
        }
    }

    ICON_CACHE.set(iconName, component)
    return component
}
