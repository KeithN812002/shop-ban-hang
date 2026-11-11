import { Button, ButtonProps } from '@workspace/ui/components/Button'
import { PermissionGuard } from './PermissionGuard'
import { usePermission, usePermissionByCode } from '@/hooks/usePermission'

interface ProtectedButtonProps extends ButtonProps {
    /**
     * MenuCode của parent menu (ModuleType = '2')
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
     * Nếu true, disable button thay vì ẩn khi không có permission
     */
    disableOnNoPermission?: boolean
}

/**
 * Button component tự động check permission
 *
 * @example
 * // Button "Thêm mới" với permission check
 * <ProtectedButton
 *   parentMenuCode="0101"
 *   action="create"
 *   onClick={handleCreate}
 * >
 *   Thêm mới
 * </ProtectedButton>
 *
 * // Button disable thay vì ẩn khi không có permission
 * <ProtectedButton
 *   parentMenuCode="0101"
 *   action="delete"
 *   disableOnNoPermission
 *   variant="destructive"
 * >
 *   Xóa
 * </ProtectedButton>
 */
export function ProtectedButton({
    parentMenuCode,
    action,
    menuCode,
    disableOnNoPermission = false,
    children,
    ...buttonProps
}: ProtectedButtonProps) {
    if (disableOnNoPermission) {
        // Nếu disable thay vì ẩn, dùng hook trực tiếp
        let hasPermission = false

        if (menuCode) {
            hasPermission = usePermissionByCode(menuCode)
        } else if (parentMenuCode && action) {
            const { hasPermission: perm } = usePermission(parentMenuCode, action)
            hasPermission = perm
        } else {
            hasPermission = true
        }

        return (
            <Button {...buttonProps} isDisabled={!hasPermission || buttonProps.isDisabled}>
                {children}
            </Button>
        )
    }

    // Ẩn button nếu không có permission
    return (
        <PermissionGuard parentMenuCode={parentMenuCode} action={action} menuCode={menuCode} hideOnNoPermission>
            <Button {...buttonProps}>{children}</Button>
        </PermissionGuard>
    )
}
