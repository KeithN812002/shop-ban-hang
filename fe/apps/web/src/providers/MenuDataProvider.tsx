import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { MenuPermissionProvider } from './MenuPermissionProvider'
import { fetchMenuData } from '@/services/menu/menu.service'
import { useMenu } from '@/hooks/useMenu'
import { Spinner } from '@workspace/ui/components/Spinner'
import type { MenuItem } from '@/types/menu.types'
import { stripBasePath } from '@/utils/menu.utils'

interface MenuDataContextType {
    menuData: MenuItem[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
}

export const menuKeys = {
    all: ['menu-data'] as const,
    byModule: (module?: string | null) => [...menuKeys.all, module] as const,
}

const MenuDataContext = createContext<MenuDataContextType | undefined>(undefined)

interface MenuDataProviderProps {
    children: ReactNode
}

/**
 * Global Menu Data Provider with React Query
 *
 * Loads menu data and automatically refreshes when mutations occur
 */
export function MenuDataProvider({ children }: MenuDataProviderProps) {
    const { t } = useTranslation()
    // Get current module from URL, skipping base path
    const routerState = useRouterState()
    const relativePath = stripBasePath(routerState.location.pathname)
    const currentModule = relativePath.split('/')[1]?.toLowerCase() || null

    // Use React Query for automatic cache management
    const {
        data: menuData = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: menuKeys.byModule(currentModule),
        queryFn: async () => {
            return fetchMenuData(currentModule || undefined)
        },
        staleTime: 0, // Always refetch when invalidated
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnWindowFocus: false, // Don't refetch on window focus
    })

    // Listen for permissions-loaded event to refetch menu data
    useEffect(() => {
        const handlePermissionsLoaded = () => {
            refetch()
        }

        window.addEventListener('permissions-loaded', handlePermissionsLoaded)
        return () => {
            window.removeEventListener('permissions-loaded', handlePermissionsLoaded)
        }
    }, [refetch])

    // Build menu tree
    const { menuTree } = useMenu(menuData)

    // Show loading state while fetching menu
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-transparent">
                <Spinner className="size-12 mb-4" />
                <p className="text-sm font-semibold text-primary animate-pulse tracking-wide italic">
                    {t('common.loading')}
                </p>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md p-6">
                    <h2 className="text-xl font-semibold mb-2">Failed to Load Menu</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {error instanceof Error ? error.message : 'Unknown error'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const errorValue = error ?? null

    return (
        <MenuDataContext.Provider
            value={{
                menuData,
                isLoading,
                error: errorValue,
                refetch,
            }}
        >
            <MenuPermissionProvider menuData={menuData} menuTree={menuTree}>
                {children}
            </MenuPermissionProvider>
        </MenuDataContext.Provider>
    )
}

/**
 * Hook to access menu data
 */
export function useMenuData() {
    const context = useContext(MenuDataContext)
    if (!context) {
        throw new Error('useMenuData must be used within MenuDataProvider')
    }
    return context
}
