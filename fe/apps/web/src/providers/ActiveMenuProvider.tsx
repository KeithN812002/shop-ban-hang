import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { MenuItem } from '@/types/menu.types'

/**
 * Context for the currently active menu item.
 * This is provided at the route level (e.g., in Splat route) to avoid prop drilling.
 */
interface ActiveMenuContextType {
    activeMenu: MenuItem | null
}

const ActiveMenuContext = createContext<ActiveMenuContextType | undefined>(undefined)

interface ActiveMenuProviderProps {
    children: ReactNode
    activeMenu: MenuItem | null
}

/**
 * Provider that supplies the current active menu item to all children.
 */
export function ActiveMenuProvider({ children, activeMenu }: ActiveMenuProviderProps) {
    const value = useMemo(() => ({ activeMenu }), [activeMenu])

    return <ActiveMenuContext.Provider value={value}>{children}</ActiveMenuContext.Provider>
}

/**
 * Hook to access the current active menu item from anywhere in the module.
 * Useful for permissions, titles, and breadcrumbs without passing props.
 */
export function useActiveMenu() {
    const context = useContext(ActiveMenuContext)
    if (context === undefined) {
        throw new Error('useActiveMenu must be used within an ActiveMenuProvider')
    }
    return context.activeMenu
}

/**
 * Same as useActiveMenu but returns null instead of throwing when no provider is mounted.
 */
export function useActiveMenuOptional() {
    return useContext(ActiveMenuContext)?.activeMenu ?? null
}
