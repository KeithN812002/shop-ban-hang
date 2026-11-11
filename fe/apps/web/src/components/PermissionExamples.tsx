/**
 * Ví dụ sử dụng hệ thống phân quyền
 *
 * File này chỉ để tham khảo, không import vào code chính
 */

import { Button } from '@workspace/ui/components/Button'
import { ProtectedButton } from './ProtectedButton'
import { PermissionGuard } from './PermissionGuard'
import { usePermission, usePermissionByCode } from '@/hooks/usePermission'
import { useMenuPermission } from '@/providers/MenuPermissionProvider'

/**
 * CÁCH 1: Sử dụng ProtectedButton (Đơn giản nhất)
 */
export function Example1_ProtectedButton() {
    return (
        <div className="flex gap-2">
            {/* Button "Thêm mới" - tự động ẩn nếu không có permission */}
            <ProtectedButton
                parentMenuCode="0101" // MenuCode của "Quản lý người dùng"
                action="create" // Action "Thêm mới"
                onClick={() => console.log('Create')}
            >
                Thêm mới
            </ProtectedButton>

            {/* Button "Xóa" - disable thay vì ẩn nếu không có permission */}
            <ProtectedButton
                parentMenuCode="0101"
                action="delete"
                disableOnNoPermission // Disable thay vì ẩn
                variant="destructive"
                onClick={() => console.log('Delete')}
            >
                Xóa
            </ProtectedButton>

            {/* Check trực tiếp bằng MenuCode của permission */}
            <ProtectedButton
                menuCode="010102" // MenuCode của permission "Thêm mới"
                onClick={() => console.log('Create by code')}
            >
                Thêm mới (by code)
            </ProtectedButton>
        </div>
    )
}

/**
 * CÁCH 2: Sử dụng PermissionGuard (Linh hoạt hơn)
 */
export function Example2_PermissionGuard() {
    return (
        <div className="flex gap-2">
            {/* Ẩn button nếu không có permission */}
            <PermissionGuard parentMenuCode="0101" action="create">
                <Button onClick={() => console.log('Create')}>Thêm mới</Button>
            </PermissionGuard>

            {/* Hiển thị fallback nếu không có permission */}
            <PermissionGuard
                parentMenuCode="0101"
                action="delete"
                fallback={<span className="text-muted-foreground">Không có quyền xóa</span>}
            >
                <Button variant="destructive" onClick={() => console.log('Delete')}>
                    Xóa
                </Button>
            </PermissionGuard>

            {/* Wrap nhiều elements */}
            <PermissionGuard parentMenuCode="0101" action="edit">
                <div className="flex gap-2">
                    <Button>Chỉnh sửa</Button>
                    <Button variant="outline">Xem chi tiết</Button>
                </div>
            </PermissionGuard>
        </div>
    )
}

/**
 * CÁCH 3: Sử dụng hook usePermission (Kiểm soát hoàn toàn)
 */
export function Example3_UsePermission() {
    const { hasPermission } = usePermission('0101', 'create')
    const canDelete = usePermissionByCode('010104') // MenuCode của permission "Xóa"

    return (
        <div className="flex gap-2">
            {hasPermission && <Button onClick={() => console.log('Create')}>Thêm mới</Button>}

            <Button onClick={() => console.log('Delete')} isDisabled={!canDelete}>
                Xóa
            </Button>
        </div>
    )
}

/**
 * CÁCH 4: Sử dụng getMenuPermissions với method can() động
 * Hỗ trợ check bất kỳ action nào (không chỉ create, edit, delete, etc.)
 */
export function Example4_GetMenuPermissions() {
    const { getMenuPermissions } = useMenuPermission()
    const permissions = getMenuPermissions('0101') // MenuCode của "Quản lý người dùng"

    return (
        <div className="flex gap-2">
            {/* Sử dụng method can() để check action động */}
            {permissions.can('create') && <Button onClick={() => console.log('Create')}>Thêm mới</Button>}

            {permissions.can('edit') && <Button onClick={() => console.log('Edit')}>Chỉnh sửa</Button>}

            {permissions.can('delete') && (
                <Button variant="destructive" onClick={() => console.log('Delete')}>
                    Xóa
                </Button>
            )}

            {permissions.can('export') && (
                <Button variant="outline" onClick={() => console.log('Export')}>
                    Xuất Excel
                </Button>
            )}

            {/* Check action tùy chỉnh bất kỳ */}
            {permissions.can('customAction') && (
                <Button variant="outline" onClick={() => console.log('Custom Action')}>
                    Custom Action
                </Button>
            )}

            {/* Check action tùy chỉnh khác */}
            {permissions.can('approve') && (
                <Button variant="outline" onClick={() => console.log('Approve')}>
                    Duyệt
                </Button>
            )}
        </div>
    )
}

/**
 * CÁCH 5: Conditional rendering phức tạp
 */
export function Example5_ConditionalRendering() {
    const { hasPermission: canCreate } = usePermission('0101', 'create')
    const { hasPermission: canEdit } = usePermission('0101', 'edit')
    const { hasPermission: canDelete } = usePermission('0101', 'delete')

    return (
        <div>
            {canCreate && (
                <div className="mb-4">
                    <h3>Anh/chị có quyền tạo mới</h3>
                    <Button onClick={() => console.log('Create')}>Thêm mới người dùng</Button>
                </div>
            )}

            {canEdit && canDelete ? (
                <div className="flex gap-2">
                    <Button onClick={() => console.log('Edit')}>Chỉnh sửa</Button>
                    <Button variant="destructive" onClick={() => console.log('Delete')}>
                        Xóa
                    </Button>
                </div>
            ) : (
                <p className="text-muted-foreground">Anh/chị chỉ có quyền xem, không thể chỉnh sửa hoặc xóa</p>
            )}
        </div>
    )
}
