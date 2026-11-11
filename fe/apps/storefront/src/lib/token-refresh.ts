import axios from 'axios'
import { env } from '@/config/env'
import { getRefreshToken, setAccessToken, setIdToken, setRefreshToken } from '@/lib/storage'
import { notifyAuthChanged } from '@/lib/auth-events'
import type { ApiResponse } from '@/types/api'

interface RefreshPayload {
    accessToken?: string
    refreshToken?: string
    idToken?: string
}

// Keycloak rotates refresh tokens: only ONE refresh call may be in flight at a time.
let inflight: Promise<string> | null = null

const performRefresh = async (): Promise<string> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available')

    // Bare axios on purpose: bypasses the interceptors so a failed refresh cannot recurse.
    const res = await axios.post<ApiResponse<RefreshPayload>>(
        `${env.apiPrefix}/sa/auth/refresh-token`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 },
    )
    const payload = res.data?.data
    if (!payload?.accessToken) throw new Error('Refresh response missing access token')

    setAccessToken(payload.accessToken)
    setRefreshToken(payload.refreshToken || refreshToken)
    if (payload.idToken) setIdToken(payload.idToken)
    notifyAuthChanged('refreshed')
    return payload.accessToken
}

export const refreshAccessTokenSingleFlight = (): Promise<string> => {
    if (!inflight) {
        inflight = performRefresh().finally(() => {
            inflight = null
        })
    }
    return inflight
}
