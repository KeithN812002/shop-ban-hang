import { BaseStatusAuditableResponse, BasePaginationResponse } from '@/types/api.types'

export interface ExternalUserResponse extends BaseStatusAuditableResponse {
    id: string
    userName: string
    personalName: string
    email?: string | null
    externalUnitCode?: string | null
}

export interface ExternalUserDetailResponse extends BaseStatusAuditableResponse {
    id: string
    userName: string
    personalName: string
    email?: string | null
    externalUnitCode?: string | null
    roles: string[]
}

export interface ExternalUserPageResponse extends BasePaginationResponse {
    items: ExternalUserResponse[]
}
