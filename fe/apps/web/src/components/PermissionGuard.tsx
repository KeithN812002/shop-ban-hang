import { ReactNode } from 'react'
import { usePermission, usePermissionByCode } from '@/hooks/usePermission'

interface PermissionGuardProps {
    /**
     * MenuCode của parent menu (ModuleType = '2')
     * Ví dụ: '0101' cho "Quản lý người dùng"
     */
    parentMenuCode?: string
    /**
     * Action cần check permission (có thể là action chuẩn hoặc action tùy chỉnh)
     * Ví dụ: 'create', 'edit', 'customAction', etc.
     */
    action?: string
    /**
     * Hoặc check trực tiếp bằng MenuCode của permission (ModuleType = '3')
     */
    menuCode?: string
    /**
     * Render khi có permission
     */
    children: ReactNode
    /**
     * Render khi không có permission (optional)
     */
    fallback?: ReactNode
    /**
     * Nếu true, ẩn hoàn toàn thay vì render fallback
     */
    hideOnNoPermission?: boolean
}

/**
 * Component wrapper để check permission trước khi render children
 *
 * @example
 * // Check permission cho button "Thêm mới"
 * <PermissionGuard parentMenuCode="0101" action="create">
 *   <Button>Thêm mới</Button>
 * </PermissionGuard>
 *
 * // Check permission trực tiếp bằng MenuCode
 * <PermissionGuard menuCode="010102">
 *   <Button>Thêm mới</Button>
 * </PermissionGuard>
 *
 * // Ẩn hoàn toàn nếu không có permission
 * <PermissionGuard parentMenuCode="0101" action="delete" hideOnNoPermission>
 *   <Button variant="destructive">Xóa</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
    parentMenuCode,
    action,
    menuCode,
    children,
    fallback = null,
    hideOnNoPermission = false,
}: PermissionGuardProps) {
    let hasPermission = false

    if (menuCode) {
        // Check trực tiếp bằng MenuCode
        hasPermission = usePermissionByCode(menuCode)
    } else if (parentMenuCode && action) {
        // Check bằng parentMenuCode + action
        const { hasPermission: perm } = usePermission(parentMenuCode, action)
        hasPermission = perm
    } else {
        // Không có thông tin để check, mặc định cho phép
        console.warn('PermissionGuard: Cần cung cấp menuCode hoặc (parentMenuCode + action)')
        hasPermission = true
    }

    if (!hasPermission) {
        if (hideOnNoPermission) {
            return null
        }
        return <>{fallback}</>
    }

    return <>{children}</>
}
