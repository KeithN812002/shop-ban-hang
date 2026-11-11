import type { PagingBase, BaseStatus } from '@/types/api.types'

export interface InternalUserFilterRequest extends PagingBase {
    userName?: string
    personalName?: string
    email?: string
    status?: BaseStatus[]
    createdBy?: string
    createdDateFrom?: string
    createdDateTo?: string
    updatedBy?: string
    updatedDateFrom?: string
    updatedDateTo?: string
    unassignedRole?: boolean
}

export interface InternalUserAssignRoleRequest {
    id: string
    roles: string[]
}
