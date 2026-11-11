import type { ComponentType, LazyExoticComponent } from 'react'
import type { MenuItem } from '@/types/menu.types'

export interface ModuleDashboard {
    /** Lazy-loaded dashboard rendered at the module root URL (e.g. `/sa`). */
    component: LazyExoticComponent<ComponentType<{ menuItem?: MenuItem }>>
    /** Document title used until the backend menu entry for the module root is resolved. */
    fallbackTitle: string
}

/**
 * Module root URL -> dashboard. A module root listed here renders its dashboard
 * instead of the category listing. Keys are lower-case paths without a trailing
 * slash. Empty by default: the core ships no dashboards. Projects register theirs:
 *
 *   registerModuleDashboard('/sa', {
 *       component: lazy(() => import('@/pages/SystemAdministration/Dashboard')),
 *       fallbackTitle: 'System administration',
 *   })
 *
 * Call it at module load (e.g. from `src/config/registerModules.ts`, imported by
 * `main.tsx`) so the entry exists before the first render.
 */
const MODULE_DASHBOARDS: Record<string, ModuleDashboard> = {}

export const registerModuleDashboard = (rootUrl: string, dashboard: ModuleDashboard): void => {
    MODULE_DASHBOARDS[rootUrl.replace(/\/$/, '')] = dashboard
}

export const getModuleDashboard = (path: string): ModuleDashboard | null =>
    MODULE_DASHBOARDS[path.replace(/\/$/, '')] ?? null
