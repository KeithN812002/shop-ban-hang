export interface ApiResponse<T = any> {
    success: boolean
    statusCode: number
    message: string
    messageCode: string
    debugMessage?: string
    data: T
    total?: number
    error?: string
    traceId?: string
}

export interface ApiError {
    success: false
    statusCode: number
    message: string
    messageCode: string
    debugMessage?: string
    data?: null
    error?: string
    traceId?: string
}

export interface BasePaginationResponse {
    total?: number
    totalElements?: number
    totalPages: number
    page?: number
    pageNumber?: number
    pageSize: number
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

export interface ListResponse<T> {
    items: T[]
    total: number
}

export interface PagingBase {
    pageNumber?: number
    pageSize?: number
    fieldName?: string
    sortType?: string
}

export type BaseStatus = 'ACTIVE' | 'INACTIVE'

export interface BaseAuditableResponse {
    createdDate?: string | null
    createdBy?: string | null
    updatedDate?: string | null
    updatedBy?: string | null
}

export interface BaseStatusAuditableResponse extends BaseAuditableResponse {
    status: BaseStatus
}

export interface LookupOption {
    extId: string
    name: string
}

// Document and email templates share one label dictionary on the BE.
// code is the bare code, each template type wraps it in its own syntax: ${code} or {code}.
export interface TemplateVariableInfo {
    code: string
    label?: string
}
