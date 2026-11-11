import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MenuItem, MenuTreeNode, AppModule } from '@/types/menu.types'
import {
    buildMenuTree,
    filterMenuByPermission,
    groupMenusByApp,
    findMenuByCode,
    findMenuByUrl,
    getBreadcrumbs,
    searchMenus,
    getDefaultExpandedCodes,
} from '@/utils/menu.utils'

/**
 * Custom hook for menu management
 */
export function useMenu(menuData: MenuItem[], currentUrl?: string) {
    const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
    const [searchKeyword, setSearchKeyword] = useState('')

    // Build menu tree
    const menuTree = useMemo(() => {
        const tree = buildMenuTree(menuData)
        return filterMenuByPermission(tree)
    }, [menuData])

    // Group by app
    const appModules = useMemo(() => {
        return groupMenusByApp(menuTree)
    }, [menuTree])

    // Search results
    const searchResults = useMemo(() => {
        if (!searchKeyword) return []
        return searchMenus(menuTree, searchKeyword)
    }, [menuTree, searchKeyword])

    // Current active menu
    const activeMenu = useMemo(() => {
        if (!currentUrl) return null
        return findMenuByUrl(menuTree, currentUrl)
    }, [menuTree, currentUrl])

    // Breadcrumbs for current menu
    const breadcrumbs = useMemo(() => {
        if (!activeMenu) return []
        return getBreadcrumbs(menuTree, activeMenu.MenuCode)
    }, [menuTree, activeMenu])

    // Auto expand to current menu on mount
    useEffect(() => {
        if (currentUrl) {
            const codes = getDefaultExpandedCodes(menuTree, currentUrl)
            setExpandedCodes(new Set(codes))
        }
    }, [menuTree, currentUrl])

    // Toggle expand/collapse
    const toggleExpand = useCallback((menuCode: string) => {
        setExpandedCodes(prev => {
            const next = new Set(prev)
            if (next.has(menuCode)) {
                next.delete(menuCode)
            } else {
                next.add(menuCode)
            }
            return next
        })
    }, [])

    // Expand all
    const expandAll = useCallback(() => {
        const allCodes = menuTree.filter(m => m.children.length > 0).map(m => m.MenuCode)
        setExpandedCodes(new Set(allCodes))
    }, [menuTree])

    // Collapse all
    const collapseAll = useCallback(() => {
        setExpandedCodes(new Set())
    }, [])

    // Check if menu is expanded
    const isExpanded = useCallback((menuCode: string) => expandedCodes.has(menuCode), [expandedCodes])

    // Find menu by code
    const getMenuByCode = useCallback((menuCode: string) => findMenuByCode(menuTree, menuCode), [menuTree])

    return {
        menuTree,
        appModules,
        activeMenu,
        breadcrumbs,
        searchKeyword,
        setSearchKeyword,
        searchResults,
        expandedCodes,
        toggleExpand,
        expandAll,
        collapseAll,
        isExpanded,
        getMenuByCode,
    }
}
