import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { env } from '@/config/env'
import { getAccessToken, getLanguage, getRefreshToken, triggerForceLogout } from '@/lib/storage'
import type { ApiResponse } from '@/types/api.types'
import { refreshAccessTokenSingleFlight } from '@/lib/tokenRefresh'

// Flag added to a retried request so a second 401 doesn't loop forever.
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export default axios

// Create axios instance
export const request: AxiosInstance = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    },
})

// Request interceptor - Add token to headers
request.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get token from sessionStorage (secure)
        const token = getAccessToken()
        const lang = getLanguage()

        // Only add token if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        } else {
            // Remove Authorization header if no token (for logout scenarios)
            delete config.headers.Authorization
        }

        // Add language header
        config.headers['accept-language'] = lang

        return config
    },
    (error: any) => {
        // Handle request error
        return Promise.reject(error)
    },
)

// Response interceptor - Handle status codes
request.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
        // Skip unwrapping for blob responses (file downloads)
        if (response.config.responseType === 'blob') {
            return response
        }

        // Unwrap response.data for standard API responses
        if (response.data) {
            return response.data as any
        }

        return response
    },
    async (error: any) => {
        // Error toasts are shown centrally by React Query's global handler
        // (handleGlobalError in Providers.tsx). Don't toast here — it would double up.

        if (error.response?.data instanceof Blob && error.response.data.type.includes('json')) {
            try {
                error.response.data = JSON.parse(await error.response.data.text())
            } catch {
                error.response.data = undefined
            }
        }

        // 401 on a normal API call → access token likely expired. Try ONE silent refresh and
        // replay the original request; only fall back to a forced logout when refresh fails.
        // Skip auth endpoints / SSO callback so they surface their own error (avoids a login loop).
        const status = error.response?.status
        const originalConfig = error.config as RetriableConfig | undefined
        const requestUrl: string = originalConfig?.url || ''
        const isAuthEndpoint = requestUrl.includes('sa/auth/')
        const onCallbackPage = typeof window !== 'undefined' && window.location.pathname.includes('/api/sso/callback')

        if (status === 401 && originalConfig && !isAuthEndpoint && !onCallbackPage) {
            // First 401 + a refresh token on hand → attempt silent refresh, then replay.
            if (!originalConfig._retry && getRefreshToken()) {
                originalConfig._retry = true
                try {
                    const newToken = await refreshAccessTokenSingleFlight()
                    originalConfig.headers = originalConfig.headers ?? {}
                    originalConfig.headers.Authorization = `Bearer ${newToken}`
                    return request(originalConfig)
                } catch {
                    // Refresh token expired / revoked → terminal: start the 5s logout countdown.
                    triggerForceLogout('session-expired')
                    return Promise.reject(error)
                }
            }

            // No refresh token, or the replay still 401'd → session is truly dead.
            triggerForceLogout('session-expired')
        }

        return Promise.reject(error)
    },
)
