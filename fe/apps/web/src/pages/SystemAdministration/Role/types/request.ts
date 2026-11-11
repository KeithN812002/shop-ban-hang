import type { PagingBase, BaseStatus } from '@/types/api.types'

export interface RoleFilterRequest extends PagingBase {
    code?: string
    name?: string
    status?: BaseStatus[]
    createdBy?: string
    createdDateFrom?: string
    createdDateTo?: string
    updatedBy?: string
    updatedDateFrom?: string
    updatedDateTo?: string
}

export interface RoleCreateRequest {
    name: string
    permissionIds: string[]
    status: BaseStatus
}

export interface RoleUpdateRequest {
    id: string
    name: string
    permissionIds: string[]
    status: BaseStatus
}
