import { useMenuPermission } from '@/providers/MenuPermissionProvider'
import { useMenu } from '@/hooks/useMenu'
import { useMenuData } from '@/providers/MenuDataProvider'
import { useRouterState } from '@tanstack/react-router'
import type { MenuTreeNode } from '@/types/menu.types'
import { PermissionTypeEnum } from '@/constants/options'

/**
 * Hook để check permission cho button/action
 * Tự động tìm permission theo URL pattern: /url1/url2/A/{action}
 * Hỗ trợ action động bất kỳ (không chỉ view, create, edit, etc.)
 *
 * @example
 * // Check permission cho button "Thêm mới" trong menu "Quản lý người dùng"
 * // Tự động tìm URL: /app/system/users/create
 * const { hasPermission } = usePermission('0101', 'create')
 *
 * // Check permission cho button "Xóa"
 * // Tự động tìm URL: /app/system/users/delete
 * const { hasPermission } = usePermission('0101', 'delete')
 *
 * // Check permission cho action tùy chỉnh
 * // Tự động tìm URL: /app/system/users/customAction
 * const { hasPermission } = usePermission('0101', 'customAction')
 */
export function usePermission(parentMenuCode: string, action: string) {
    const { canPerformAction, canViewMenu, findMenuByCode, findMenuByUrl, canPerformActionByPath } = useMenuPermission()
    const { menuData } = useMenuData()
    const { menuTree } = useMenu(menuData)
    const currentPath = useRouterState().location.pathname

    // Tìm parent menu trong menu tree (có children)
    const findMenuInTree = (nodes: MenuTreeNode[], code: string): MenuTreeNode | null => {
        for (const node of nodes) {
            if (node.MenuCode === code) return node
            if (node.children.length > 0) {
                const found = findMenuInTree(node.children, code)
                if (found) return found
            }
        }
        return null
    }

    const parentMenu = findMenuInTree(menuTree, parentMenuCode)

    // Đặc biệt: Action 'view' tự động có quyền nếu có quyền function
    // Vào màn hình + xem dữ liệu là 1
    if (action === 'view') {
        const hasPermission = canViewMenu(parentMenuCode)
        return {
            hasPermission,
            permissionMenuCode: undefined, // Không có permission child cho 'view'
            parentMenu,
        }
    }

    // Với các action khác, tìm permission theo URL pattern
    // Ví dụ: parent URL = /app/system/users -> permission URL = /app/system/users/create
    if (parentMenu?.Url) {
        const permissionUrl = `${parentMenu.Url}/${action}`
        const permissionMenu = findMenuByUrl(permissionUrl)

        if (permissionMenu && permissionMenu.ModuleType === PermissionTypeEnum.FUNCTION) {
            const hasPermission = canPerformAction(permissionMenu.MenuCode, action)
            return {
                hasPermission,
                permissionMenuCode: permissionMenu.MenuCode,
                parentMenu,
            }
        }

        // Nếu không tìm thấy theo URL pattern, check theo current path
        // Ví dụ: currentPath = /app/system/users/create
        if (currentPath === permissionUrl) {
            const hasPermission = canPerformActionByPath(currentPath, action)
            return {
                hasPermission,
                permissionMenuCode: undefined,
                parentMenu,
            }
        }
    }

    // Không tìm thấy permission
    return {
        hasPermission: false,
        permissionMenuCode: undefined,
        parentMenu,
    }
}

/**
 * Hook đơn giản hơn để check permission trực tiếp bằng MenuCode
 *
 * @example
 * const canCreate = usePermissionByCode('010102') // MenuCode của permission "Thêm mới"
 */
export function usePermissionByCode(menuCode: string) {
    const { canViewMenu } = useMenuPermission()
    return canViewMenu(menuCode)
}
