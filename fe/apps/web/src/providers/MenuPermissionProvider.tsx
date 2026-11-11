import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react'
import type { MenuItem, MenuTreeNode, MenuAction } from '@/types/menu.types'
import { findBestMenuByUrl, flattenMenuTree, stripBasePath } from '@/utils/menu.utils'
import { PermissionTypeEnum } from '@/constants/options'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@workspace/ui/components/EmptyState'

interface MenuPermissionContextType {
    canViewMenu: (menuCode: string) => boolean
    canAccessRoute: (url: string) => boolean
    canPerformAction: (menuCode: string, action: string) => boolean
    canPerformActionByPath: (currentPath: string, action: string) => boolean
    canPerformActionByUrl: (url: string, action: string) => boolean
    getMenuPermissions: (menuCode: string) => MenuPermissions
    hasAnyPermission: (menuCodes: string[]) => boolean
    findMenuByUrl: (url: string) => MenuItem | null
    findMenuByCode: (menuCode: string) => MenuItem | null
}

/**
 * Menu Permissions - Object động với method can() để check bất kỳ action nào
 */
interface MenuPermissions {
    /**
     * Check permission cho action bất kỳ
     * @param action - Action name (ví dụ: 'create', 'edit', 'customAction', etc.)
     * @returns true nếu có quyền, false nếu không
     */
    can: (action: string) => boolean
    /**
     * Check quyền view (vào màn hình + xem dữ liệu)
     * Luôn true nếu menu tồn tại và active
     */
    canView: boolean
}

const MenuPermissionContext = createContext<MenuPermissionContextType | undefined>(undefined)

interface MenuPermissionProviderProps {
    children: ReactNode
    menuData: MenuItem[]
    menuTree: MenuTreeNode[]
}

export function MenuPermissionProvider({ children, menuData, menuTree }: MenuPermissionProviderProps) {
    // Flatten tree for quick lookup
    const flatMenus = useMemo(() => flattenMenuTree(menuTree), [menuTree])

    // Create lookup map for faster access
    const menuMap = useMemo(() => {
        const map = new Map<string, MenuTreeNode>()
        flatMenus.forEach(menu => map.set(menu.MenuCode, menu))
        return map
    }, [flatMenus])

    const urlMap = useMemo(() => {
        const map = new Map<string, MenuTreeNode>()
        flatMenus.forEach(menu => {
            if (menu.Url) map.set(menu.Url, menu)
        })
        return map
    }, [flatMenus])

    /**
     * Check if user can view menu item (vào màn hình + xem dữ liệu)
     * Logic: Menu tồn tại trong menuMap (đã được filter) = user có quyền
     * IncludeMenu KHÔNG liên quan đến phân quyền, chỉ để hiển thị menu
     */
    const canViewMenu = useCallback(
        (menuCode: string): boolean => {
            const menu = menuMap.get(menuCode)
            if (!menu) return false

            // Nếu menu tồn tại trong menuMap, nghĩa là đã pass qua filter
            // Chỉ cần check Status (IncludeMenu chỉ để hiển thị menu, không liên quan phân quyền)
            return menu.Status === 'A'
        },
        [menuMap],
    )

    /**
     * Check permission action theo URL pattern
     * Ví dụ: /url1/url2/A/create -> check permission 'create' của function A
     * Hỗ trợ action động bất kỳ
     */
    const canPerformActionByUrl = useCallback(
        (url: string, action: string): boolean => {
            const pathParts = url.split('/').filter(Boolean)
            if (pathParts.length < 2) return false

            // Tìm parent function path (bỏ phần action cuối)
            const parentPath = '/' + pathParts.slice(0, -1).join('/')
            const parentMenu = urlMap.get(parentPath)

            if (!parentMenu || parentMenu.ModuleType !== PermissionTypeEnum.MENU) {
                return false
            }

            // Tìm permission child có URL pattern tương ứng
            const permissionUrl = url
            const permissionMenu = urlMap.get(permissionUrl)

            if (permissionMenu && permissionMenu.ModuleType === PermissionTypeEnum.FUNCTION) {
                return permissionMenu.Status === 'A'
            }

            return false
        },
        [urlMap],
    )

    /**
     * Check if user can access route/URL
     * Check theo full path hiện tại
     */
    const canAccessRoute = useCallback(
        (url: string): boolean => {
            const cleanUrl = stripBasePath(url)
            // Tìm menu theo exact URL match
            const menu = urlMap.get(cleanUrl)
            if (!menu) {
                // Thử tìm theo pattern match (ví dụ: /url/{placeholder})
                const matchedMenu = findBestMenuByUrl(flatMenus, cleanUrl)
                if (matchedMenu) {
                    return matchedMenu.Status === 'A'
                }

                // Nếu không tìm thấy exact match hoặc pattern match, có thể là permission URL pattern
                // Ví dụ: /url1/url2/A/create -> tìm parent /url1/url2/A
                const pathParts = url.split('/').filter(Boolean)
                if (pathParts.length > 1) {
                    // Thử tìm parent path (bỏ phần cuối - action)
                    const parentPath = '/' + pathParts.slice(0, -1).join('/')
                    const parentMenu = urlMap.get(parentPath)
                    if (parentMenu && parentMenu.ModuleType === PermissionTypeEnum.MENU) {
                        // Có parent function, check permission action
                        const action = pathParts[pathParts.length - 1] // 'create', 'edit', etc.
                        if (action) {
                            return canPerformActionByUrl(url, action)
                        }
                    }
                }
                // Không tìm thấy trong menu = public route (cho phép)
                return true
            }

            // Menu tồn tại = có quyền
            return menu.Status === 'A'
        },
        [urlMap, flatMenus, canPerformActionByUrl],
    )

    /**
     * Check if user can perform specific action
     * Hỗ trợ action động bất kỳ (không chỉ view, create, edit, etc.)
     *
     * Logic:
     * - ModuleType = '3' (FE Permission): Nếu menu tồn tại trong menuMap = có quyền action đó
     * - ModuleType = '2' (Function):
     *   - Action 'view': Tự động có quyền nếu có quyền function (vào màn hình + xem dữ liệu là 1)
     *   - Action khác: Tìm permission child theo URL pattern
     * - ModuleType = '4' (BE Permission): Nếu menu tồn tại trong menuMap = có quyền
     * - ModuleType = '1' (Group): Không dùng cho action check
     */
    const canPerformAction = useCallback(
        (menuCode: string, action: string): boolean => {
            const menu = menuMap.get(menuCode)
            if (!menu) return false

            // Base check: menu phải active
            if (menu.Status !== 'A') return false

            // For FE permissions (ModuleType = 'FUNCTION')
            // Đây là các permission items như "Thêm mới", "Xóa", etc.
            // Nếu menu tồn tại trong menuMap = có quyền action đó
            if (menu.ModuleType === PermissionTypeEnum.FUNCTION) {
                return true
            }

            // For functions (ModuleType = 'MENU')
            // - Action 'view': Tự động có quyền nếu có quyền function (vào màn hình + xem dữ liệu là 1)
            // - Action khác: Cần tìm permission child theo URL pattern
            if (menu.ModuleType === PermissionTypeEnum.MENU) {
                if (action === 'view') {
                    // Quyền "vào màn hình + xem dữ liệu" tự động có khi có quyền function
                    return true
                }
                // Với action khác, cần tìm permission child theo URL pattern
                // Logic này sẽ được xử lý trong usePermission hook
                return false
            }

            // For BE permissions (ModuleType = 'API')
            if (menu.ModuleType === PermissionTypeEnum.API) {
                return true
            }

            // Groups/Modules không dùng cho action check
            return false
        },
        [menuMap],
    )

    /**
     * Check permission theo full current path
     * Ví dụ: currentPath = /url1/url2/A/create -> check permission 'create'
     * Hỗ trợ action động bất kỳ
     */
    const canPerformActionByPath = useCallback(
        (currentPath: string, action: string): boolean => {
            // Tìm menu theo exact path
            const menu = urlMap.get(currentPath)
            if (menu && menu.ModuleType === PermissionTypeEnum.FUNCTION) {
                return menu.Status === 'A'
            }

            // Nếu không tìm thấy, có thể là URL pattern
            // Ví dụ: /url1/url2/A/create -> tìm parent /url1/url2/A
            return canPerformActionByUrl(currentPath, action)
        },
        [urlMap, canPerformActionByUrl],
    )

    /**
     * Get all permissions for a menu (ModuleType = '2')
     * Trả về object với method can(action) để check động bất kỳ action nào
     */
    const getMenuPermissions = useCallback(
        (menuCode: string): MenuPermissions => {
            const menu = menuMap.get(menuCode)

            // Cache để tránh check lại nhiều lần
            const permissionCache = new Map<string, boolean>()

            // Helper function để check permission cho action bất kỳ
            const checkAction = (action: string): boolean => {
                // Nếu đã cache, trả về kết quả
                if (permissionCache.has(action)) {
                    return permissionCache.get(action)!
                }

                // Action 'view' luôn có quyền nếu menu tồn tại và active
                if (action === 'view') {
                    const hasPermission = menu !== undefined && menu.Status === 'A'
                    permissionCache.set(action, hasPermission)
                    return hasPermission
                }

                // Nếu menu không tồn tại hoặc không active
                if (!menu || menu.Status !== 'A') {
                    permissionCache.set(action, false)
                    return false
                }

                // Nếu là permission item (ModuleType = 'FUNCTION'), không dùng hàm này
                if (menu.ModuleType === PermissionTypeEnum.FUNCTION) {
                    const hasPermission = true // Menu tồn tại = có quyền
                    permissionCache.set(action, hasPermission)
                    return hasPermission
                }

                // Nếu là function (ModuleType = 'MENU'), tìm permission theo URL pattern
                if (menu.ModuleType === PermissionTypeEnum.MENU && menu.Url) {
                    const permissionUrl = `${menu.Url}/${action}`
                    const permissionMenu = urlMap.get(permissionUrl)

                    const hasPermission =
                        permissionMenu !== undefined &&
                        permissionMenu.ModuleType === PermissionTypeEnum.FUNCTION &&
                        permissionMenu.Status === 'A'

                    permissionCache.set(action, hasPermission)
                    return hasPermission
                }

                // Default: không có permission
                permissionCache.set(action, false)
                return false
            }

            const canView = menu !== undefined && menu.Status === 'A'

            return {
                can: checkAction,
                canView,
            }
        },
        [menuMap, urlMap],
    )

    /**
     * Check if user has any permission in a list of menu codes
     */
    const hasAnyPermission = useCallback(
        (menuCodes: string[]): boolean => {
            return menuCodes.some(code => canViewMenu(code))
        },
        [canViewMenu],
    )

    /**
     * Find menu item by URL
     * Normalizes URL by removing trailing slashes
     */
    const findMenuByUrl = useCallback(
        (url: string): MenuItem | null => {
            const cleanUrl = stripBasePath(url)
            // Normalize URL: remove trailing slash except for root
            const normalizedUrl = cleanUrl.length > 1 && cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl
            const menu = urlMap.get(normalizedUrl)

            if (menu) return menu || null

            // Thử tìm theo pattern match (ví dụ: /url/{placeholder})
            return findBestMenuByUrl(flatMenus, normalizedUrl)
        },
        [urlMap, flatMenus],
    )

    /**
     * Find menu item by MenuCode
     */
    const findMenuByCode = useCallback(
        (menuCode: string): MenuItem | null => {
            const menu = menuMap.get(menuCode)
            return menu || null
        },
        [menuMap],
    )

    const value = useMemo(
        () => ({
            canViewMenu,
            canAccessRoute,
            canPerformAction,
            canPerformActionByPath,
            canPerformActionByUrl,
            getMenuPermissions,
            hasAnyPermission,
            findMenuByUrl,
            findMenuByCode,
        }),
        [
            canViewMenu,
            canAccessRoute,
            canPerformAction,
            canPerformActionByPath,
            canPerformActionByUrl,
            getMenuPermissions,
            hasAnyPermission,
            findMenuByUrl,
            findMenuByCode,
        ],
    )

    return <MenuPermissionContext.Provider value={value}>{children}</MenuPermissionContext.Provider>
}

/**
 * Hook to use menu permissions
 */
export function useMenuPermission() {
    const context = useContext(MenuPermissionContext)
    if (!context) {
        throw new Error('useMenuPermission must be used within MenuPermissionProvider')
    }
    return context
}

function ForbiddenState() {
    const { t } = useTranslation()

    return (
        <EmptyState
            kind="blocked"
            tone="destructive"
            title={t('dynamicRoute.accessDenied.title')}
            description={t('dynamicRoute.accessDenied.description')}
            className="min-h-screen"
        />
    )
}

/**
 * HOC for route protection
 */
export function withMenuPermission<P extends object>(Component: React.ComponentType<P>, requiredMenuCode: string) {
    return function ProtectedComponent(props: P) {
        const { canViewMenu } = useMenuPermission()

        if (!canViewMenu(requiredMenuCode)) {
            return <ForbiddenState />
        }

        return <Component {...props} />
    }
}
