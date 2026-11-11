import { apiPost, http } from '@/lib/http'
import type { ApiResponse } from '@/types/api'

export interface AuthTokens {
    accessToken: string
    refreshToken?: string
    idToken?: string
    expiresIn?: number
}

/** Keycloak authorization code -> tokens (backend performs the code exchange). */
export const exchangeAuthCode = async (code: string, redirectUri: string): Promise<AuthTokens> => {
    const body = new URLSearchParams({ authCode: code, redirectUri })
    const res = await http.post<ApiResponse<AuthTokens>>('sa/auth/exchange-auth-code', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const tokens = res.data?.data
    if (!tokens?.accessToken) throw new Error('Token exchange returned no access token')
    return tokens
}

export const logoutApi = async (refreshToken: string | null): Promise<void> => {
    try {
        await apiPost('sa/auth/logout', { refreshToken: refreshToken ?? '' })
    } catch (error) {
        // Non-critical: local session is cleared regardless.
        console.warn('Backend logout failed', error)
    }
}
