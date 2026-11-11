/** Contract §2: every response is wrapped in Response<T>. */
export interface ApiResponse<T> {
    statusCode: number
    message: string
    data: T
    error?: string | null
    traceId?: string | null
}

export interface PageResult<T> {
    items: T[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
}

export interface PagingParams {
    pageNumber?: number
    pageSize?: number
}

export type Uuid = string
