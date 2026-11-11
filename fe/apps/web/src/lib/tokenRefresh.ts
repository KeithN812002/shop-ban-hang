import axios from 'axios'
import { env } from '@/config/env'
import {
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setIdToken,
    setAccessTokenExpiresInSeconds,
} from '@/lib/storage'

// Single-flight guard: many requests can 401 at once, but only ONE refresh call should hit
// the backend (Keycloak rotates the refresh token, so a second concurrent call would fail).
let refreshPromise: Promise<string> | null = null

const refreshUrl = (): string => {
    const base = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl : `${env.apiBaseUrl}/`
    return `${base}sa/auth/refresh-token`
}

const performTokenRefresh = async (): Promise<string> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
        throw new Error('No refresh token available')
    }

    // Bare axios (not the shared `request` instance) → bypasses the auth interceptors so a
    // failed refresh can't recurse into another refresh, and no stale Bearer token is sent.
    const response = await axios.post(
        refreshUrl(),
        { refreshToken },
        // Bound the call so a stuck refresh can't pin the single-flight promise open and
        // block every queued 401 retry forever.
        { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 },
    )

    // Backend wraps payloads in Response<T> → { data: {...} }.
    const payload = response.data?.data ?? response.data
    const accessToken: string | undefined = payload?.accessToken
    if (!accessToken) {
        throw new Error('Refresh response missing access token')
    }

    setAccessToken(accessToken)
    setRefreshToken(payload.refreshToken || refreshToken)
    if (payload.idToken) {
        setIdToken(payload.idToken)
    }
    setAccessTokenExpiresInSeconds(payload.expiresIn)

    // Let React (AuthProvider) sync its in-memory auth state + reschedule the proactive timer.
    window.dispatchEvent(new Event('auth-token-refreshed'))

    return accessToken
}

/**
 * Refresh the access token, coalescing concurrent callers onto a single in-flight request.
 * Resolves with the new access token, or rejects if no refresh token exists / the refresh fails.
 */
export const refreshAccessTokenSingleFlight = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise
}
