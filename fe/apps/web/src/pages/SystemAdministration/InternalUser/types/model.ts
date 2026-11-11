import { BaseStatusAuditableResponse, BasePaginationResponse } from '@/types/api.types'

export interface InternalUserResponse extends BaseStatusAuditableResponse {
    id: string
    userName: string
    personalName: string
    email?: string | null
}

export interface InternalUserDetailResponse extends BaseStatusAuditableResponse {
    id: string
    userName: string
    personalName: string
    email?: string | null
    roles: string[]
}

export interface InternalUserPageResponse extends BasePaginationResponse {
    items: InternalUserResponse[]
}
