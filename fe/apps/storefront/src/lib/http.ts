import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { getAccessToken, getLanguage, getRefreshToken } from '@/lib/storage'
import { notifyAuthChanged } from '@/lib/auth-events'
import { refreshAccessTokenSingleFlight } from '@/lib/token-refresh'
import type { ApiResponse } from '@/types/api'

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const http: AxiosInstance = axios.create({
    baseURL: env.apiPrefix,
    timeout: 60_000,
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

http.interceptors.request.use(config => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    else delete config.headers.Authorization
    config.headers['accept-language'] = getLanguage()
    return config
})

http.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined
        const isAuthEndpoint = (original?.url ?? '').includes('sa/auth/')

        if (error.response?.status === 401 && original && !isAuthEndpoint) {
            if (!original._retry && getRefreshToken()) {
                original._retry = true
                try {
                    const token = await refreshAccessTokenSingleFlight()
                    original.headers.Authorization = `Bearer ${token}`
                    return http(original)
                } catch {
                    // Refresh token expired or revoked: the session is over.
                    notifyAuthChanged('expired')
                    return Promise.reject(error)
                }
            }
            if (getAccessToken()) notifyAuthChanged('expired')
        }
        return Promise.reject(error)
    },
)

/** Error raised for a failed call, carrying the server-provided (localised) message. */
export class ApiError extends Error {
    readonly status: number
    readonly traceId?: string

    constructor(message: string, status: number, traceId?: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.traceId = traceId
    }
}

const toApiError = (error: unknown): Error => {
    if (error instanceof ApiError) return error
    if (axios.isAxiosError<Partial<ApiResponse<unknown>>>(error)) {
        const body = error.response?.data
        const status = error.response?.status ?? 0
        const message = body?.message || (status === 0 ? 'Network Error' : error.message)
        return new ApiError(message, status, body?.traceId ?? undefined)
    }
    return error instanceof Error ? error : new Error(String(error))
}

/** Unwraps Response<T>; a body-level statusCode >= 400 is treated as a failure. */
const unwrap = <T>(body: ApiResponse<T> | undefined): T => {
    if (body && typeof body.statusCode === 'number' && body.statusCode >= 400) {
        throw new ApiError(body.message, body.statusCode, body.traceId ?? undefined)
    }
    return body?.data as T
}

type Params = Record<string, string | number | boolean | undefined | null>

export const cleanParams = (params?: Params): Record<string, string | number | boolean> | undefined => {
    if (!params) return undefined
    const out: Record<string, string | number | boolean> = {}
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue
        out[key] = value
    }
    return out
}

export const apiGet = async <T>(url: string, params?: Params): Promise<T> => {
    try {
        const res = await http.get<ApiResponse<T>>(url, { params: cleanParams(params) })
        return unwrap(res.data)
    } catch (error) {
        throw toApiError(error)
    }
}

export const apiPost = async <T = void>(url: string, body?: unknown): Promise<T> => {
    try {
        const res = await http.post<ApiResponse<T>>(url, body)
        return unwrap(res.data)
    } catch (error) {
        throw toApiError(error)
    }
}

export const apiUpload = async <T>(url: string, file: File, field = 'file'): Promise<T> => {
    const form = new FormData()
    form.append(field, file)
    try {
        const res = await http.post<ApiResponse<T>>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        return unwrap(res.data)
    } catch (error) {
        throw toApiError(error)
    }
}

export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof ApiError && error.message) return error.message
    if (error instanceof Error && error.message) return error.message
    return fallback
}
