import type { PaginatedResponse } from '@/types/api.types'

export const cleanParams = (params: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== ''),
    )
}

export const cleanPayload = (data: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]))
}

export const toPaginated = <T>(
    payload:
        | {
              items?: T[]
              total?: number
              totalElements?: number
              totalPages?: number
              page?: number
              pageNumber?: number
              pageSize?: number
          }
        | null
        | undefined,
    fallbackPageSize: number,
): PaginatedResponse<T> => ({
    items: payload?.items ?? [],
    total: payload?.total ?? payload?.totalElements ?? 0,
    totalPages: payload?.totalPages ?? 0,
    page: payload?.page ?? payload?.pageNumber ?? 1,
    pageSize: payload?.pageSize ?? fallbackPageSize,
})

export const getErrorMessage = (error: any, fallback: string) => {
    const data = error?.response?.data
    const message = data?.message || error?.message || fallback
    const traceId = data?.traceId || data?.messageCode || data?.debugMessage || ''
    const errorType = data?.error // "VALIDATION", "BUSINESS", "TECHNICAL", "SECURITY"
    const validationData = data?.data // array of { field, message }

    return {
        message,
        traceId,
        errorType,
        validationData,
        fullError: `${message}${traceId ? ` (Trace: ${traceId})` : ''}`,
    }
}
