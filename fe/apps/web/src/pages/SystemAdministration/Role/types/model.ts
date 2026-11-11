import { BaseStatusAuditableResponse, BasePaginationResponse, LookupOption } from '@/types/api.types'
import type { RoleSummaryDto } from '../services/mapper'
export type { LookupOption }

export interface RoleResponse extends BaseStatusAuditableResponse {
    id: string
    code: string
    name: string
}

export interface RoleDetailResponse extends BaseStatusAuditableResponse {
    id: string
    code: string
    name: string
    permissionIds: string[]
}

export interface RolePageResponse extends BasePaginationResponse {
    items: RoleSummaryDto[]
}
