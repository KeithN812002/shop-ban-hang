import type { PagingBase, BaseStatus } from '@/types/api.types'

export interface ExternalUserFilterRequest extends PagingBase {
    userName?: string
    personalName?: string
    email?: string
    status?: BaseStatus[]
    externalUnitCode?: string[]
    createdBy?: string
    createdDateFrom?: string
    createdDateTo?: string
    updatedBy?: string
    updatedDateFrom?: string
    updatedDateTo?: string
}

export interface ExternalUserCreateRequest {
    userName: string
    personalName: string
    email: string
    roles: string[]
    status: BaseStatus
    externalUnitCode?: string | null
}

export interface ExternalUserUpdateRequest {
    id: string
    personalName: string
    email: string
    roles: string[]
    status: BaseStatus
    externalUnitCode?: string | null
}
