import type { MenuTreeNode } from '@/types/menu.types'

export interface MenuBadge {
    count: number
    /** Tailwind classes applied to the sidebar badge (e.g. colour by severity). */
    className: string
}

/** Badges keyed by the normalized menu `PathFolder` (see `normalizeMenuFolder`). */
export type MenuBadgeMap = Record<string, MenuBadge | undefined>

/**
 * A provider is a React hook (it may call `useQuery`, etc.) that receives the
 * menu tree visible to the user and returns the badges to show on sidebar items.
 */
export type MenuBadgeProvider = (menuTree: MenuTreeNode[]) => MenuBadgeMap

const EMPTY_BADGES: MenuBadgeMap = {}
const providers: MenuBadgeProvider[] = []

/**
 * Register a badge provider at module load, before the first render. The list must
 * not change after the app mounts because providers are called as hooks on every render.
 */
export const registerMenuBadgeProvider = (provider: MenuBadgeProvider): void => {
    providers.push(provider)
}

/** Merge the badges from all registered providers. Returns a stable empty map when none are registered. */
export const useMenuBadges = (menuTree: MenuTreeNode[]): MenuBadgeMap => {
    if (providers.length === 0) return EMPTY_BADGES
    // The provider list is fixed after startup, so the hook call order is stable between renders.
    return providers.reduce<MenuBadgeMap>((acc, provider) => ({ ...acc, ...provider(menuTree) }), {})
}
