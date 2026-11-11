import { useState, useCallback } from 'react'
import { useExchangeAuthCode, useFetchUserInfo, useFetchPermissions, useLogout } from '@/services/auth'
import { env, getCallbackRedirectUri } from '@/config/env'
import { disconnectSocket } from '@/lib/socket'
import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    setIdToken,
    setAccessTokenExpiresInSeconds,
    getUserInfoCache,
    clearUserInfoCache,
    clearForceLogout,
} from '@/lib/storage'
import type { PermissionView, UserInfo } from '@/services/auth'

interface AuthState {
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
}

interface AuthFlowResult {
    authState: AuthState
    user: UserInfo | undefined
    isLoading: boolean
    isUserLoading: boolean
    userInfoError: unknown
    exchangeCodeForToken: (code: string) => Promise<void>
    fetchUserInfo: () => Promise<UserInfo | undefined>
    fetchPermissions: () => Promise<PermissionView[] | undefined>
    logout: () => Promise<void>
    setAuthState: (state: Partial<AuthState>) => void
}

export function useAuthFlow(): AuthFlowResult {
    const [authState, setAuthStateInternal] = useState<AuthState>(() => {
        return {
            token: getAccessToken(),
            refreshToken: getRefreshToken(),
            isAuthenticated: !!getAccessToken(),
        }
    })

    const exchangeAuthCodeMutation = useExchangeAuthCode()
    const logoutMutation = useLogout()

    const {
        data: fetchedUser,
        isLoading: isUserLoading,
        error: userInfoError,
        refetch: refetchUserInfo,
    } = useFetchUserInfo(false)

    const { refetch: refetchPermissions } = useFetchPermissions(false)

    const cachedUser = getUserInfoCache<UserInfo>()
    const user = fetchedUser ?? cachedUser ?? undefined

    const exchangeCodeForToken = useCallback(
        async (code: string) => {
            const redirectUri = getCallbackRedirectUri()

            const tokenData = await exchangeAuthCodeMutation.mutateAsync({
                code,
                redirect_uri: redirectUri,
            })

            // New session: drop stale user info cache so /me is fetched fresh (not skipped),
            // and discard any leftover forced-logout countdown from a previous session.
            clearUserInfoCache()
            clearForceLogout()

            setAccessToken(tokenData.accessToken)
            setRefreshToken(tokenData.refreshToken)
            if (tokenData.idToken) {
                setIdToken(tokenData.idToken)
            }
            setAccessTokenExpiresInSeconds(tokenData.expiresIn)

            const newState: AuthState = {
                token: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                isAuthenticated: true,
            }

            setAuthStateInternal(newState)
        },
        [exchangeAuthCodeMutation],
    )

    const logout = useCallback(async () => {
        try {
            await logoutMutation.mutateAsync(authState.token || undefined)
        } catch (error) {
            console.error('Logout API call failed:', error)
        } finally {
            if (env.enableSocket) {
                disconnectSocket()
            }

            setAuthStateInternal({
                token: null,
                refreshToken: null,
                isAuthenticated: false,
            })

            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
        }
    }, [authState.token, logoutMutation])

    const setAuthState = useCallback((state: Partial<AuthState>) => {
        setAuthStateInternal(prev => ({ ...prev, ...state }))
    }, [])

    const fetchUserInfo = useCallback(async () => {
        const result = await refetchUserInfo()
        return result.data
    }, [refetchUserInfo])

    const fetchPermissions = useCallback(async () => {
        const result = await refetchPermissions()
        return result.data
    }, [refetchPermissions])

    return {
        authState,
        user,
        isLoading: exchangeAuthCodeMutation.isPending || logoutMutation.isPending,
        isUserLoading,
        userInfoError,
        exchangeCodeForToken,
        logout,
        setAuthState,
        fetchUserInfo,
        fetchPermissions,
    }
}
