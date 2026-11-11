import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { keycloakHelpers } from '@/lib/keycloak'
import { connectSocket } from '@/lib/socket'
import {
    clearAuthData,
    clearUserInfoCache,
    getUserInfoCache,
    setUserInfoCache,
    getAccessToken,
    getRefreshToken,
    getAccessTokenExpiresAt,
    getForceLogoutReason,
    getForceLogoutStart,
    clearForceLogout,
    triggerForceLogout,
} from '@/lib/storage'
import { refreshAccessTokenSingleFlight } from '@/lib/tokenRefresh'
import { env } from '@/config/env'
import { useAuthFlow } from '@/hooks/useAuthFlow'
import type { UserInfo } from '@/services/auth'
import { useTranslation } from 'react-i18next'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: UserInfo | null
    userInfoError: unknown
    token: string | null
    refreshToken: string | null
    login: () => void
    logout: () => void
    updateToken: (minValidity?: number) => Promise<boolean>
    hasRole: (role: string) => boolean
    exchangeCodeForToken: (code: string) => Promise<void>
    fetchUserInfo: () => Promise<UserInfo | undefined>
    setAuthState: (
        state: Partial<{ token: string | null; refreshToken: string | null; isAuthenticated: boolean }>,
    ) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isBootstrapping, setIsBootstrapping] = useState(true)
    const [forceLogoutRemaining, setForceLogoutRemaining] = useState<number | null>(null)
    const { t } = useTranslation()

    const {
        authState,
        user,
        isLoading: isAuthLoading,
        isUserLoading,
        userInfoError,
        exchangeCodeForToken,
        fetchUserInfo,
        logout: logoutUser,
        setAuthState,
    } = useAuthFlow()

    const login = useCallback(() => keycloakHelpers.login(), [])

    const updateToken = useCallback(async (_minValidity = 5): Promise<boolean> => {
        // Route through the shared single-flight so this never races with the axios/proactive
        // refresh and double-consumes a rotated refresh token.
        try {
            await refreshAccessTokenSingleFlight()
            return true
        } catch (error) {
            console.error('Token update failed:', error)
            return false
        }
    }, [])

    const logout = useCallback(async () => {
        await logoutUser()
        clearUserInfoCache()
        // End the Keycloak SSO session so the user is not silently re-authenticated.
        keycloakHelpers.logout()
    }, [logoutUser])

    const hasRole = useCallback((_role: string): boolean => {
        return false // MeResponse from BE no longer contains roles field directly
    }, [])

    const checkForceLogout = useCallback(() => {
        const forceLogoutStart = getForceLogoutStart()
        if (!forceLogoutStart) {
            setForceLogoutRemaining(null)
            return
        }

        const elapsed = Date.now() - forceLogoutStart
        if (elapsed >= 5000) {
            clearForceLogout()
            void logout()
        } else {
            const remaining = 5000 - elapsed
            setForceLogoutRemaining(Math.ceil(remaining / 1000))
        }
    }, [logout])

    useEffect(() => {
        checkForceLogout()

        const handleStorageOrStart = () => {
            checkForceLogout()
        }

        window.addEventListener('force-logout-countdown-start', handleStorageOrStart)
        window.addEventListener('storage', handleStorageOrStart)

        return () => {
            window.removeEventListener('force-logout-countdown-start', handleStorageOrStart)
            window.removeEventListener('storage', handleStorageOrStart)
        }
    }, [checkForceLogout])

    useEffect(() => {
        if (forceLogoutRemaining === null) return

        const timer = setInterval(() => {
            const forceLogoutStart = getForceLogoutStart()
            if (!forceLogoutStart) {
                clearInterval(timer)
                setForceLogoutRemaining(null)
                return
            }

            const elapsed = Date.now() - forceLogoutStart
            if (elapsed >= 5000) {
                clearInterval(timer)
                clearForceLogout()
                setForceLogoutRemaining(null)
                void logout()
            } else {
                setForceLogoutRemaining(Math.ceil((5000 - elapsed) / 1000))
            }
        }, 500)

        return () => clearInterval(timer)
    }, [forceLogoutRemaining, logout])

    // A silent refresh in the axios layer updates localStorage from outside React; sync the
    // in-memory auth state so the proactive timer reschedules and the socket reconnects.
    useEffect(() => {
        const handleTokenRefreshed = () => {
            // A fresh, valid token arrived → cancel any forced-logout countdown that may have
            // started from a transient failure, so we never log out a re-authenticated user.
            clearForceLogout()
            setForceLogoutRemaining(null)
            setAuthState({
                token: getAccessToken(),
                refreshToken: getRefreshToken(),
                isAuthenticated: !!getAccessToken(),
            })
            // No need to re-fetch /me: the backend re-caches the user's permissions on the
            // refresh-token call itself (TTL = refresh_expires_in).
        }
        window.addEventListener('auth-token-refreshed', handleTokenRefreshed)
        return () => window.removeEventListener('auth-token-refreshed', handleTokenRefreshed)
    }, [setAuthState])

    // Proactive refresh: renew the access token ~60s before it expires so the user never hits
    // a 401 mid-action. On failure, fall back to the forced-logout countdown.
    useEffect(() => {
        if (!authState.token) return
        // No refresh token → proactively refreshing is pointless and would log the user out a
        // minute early; let the reactive 401 path handle expiry instead.
        if (!getRefreshToken()) return
        const expiresAt = getAccessTokenExpiresAt()
        if (!expiresAt) return

        const REFRESH_SKEW_MS = 60_000
        const delay = expiresAt - Date.now() - REFRESH_SKEW_MS

        const run = () => {
            refreshAccessTokenSingleFlight().catch(() => {
                triggerForceLogout('session-expired')
            })
        }

        // Already within the skew window → refresh immediately.
        if (delay <= 0) {
            run()
            return
        }

        const timer = setTimeout(run, delay)
        return () => clearTimeout(timer)
    }, [authState.token])

    useEffect(() => {
        const bootstrap = async () => {
            try {
                if (window.location.pathname.startsWith('/api/sso/callback')) {
                    return
                }

                // No token yet → kick off the Keycloak login flow.
                if (!authState.token) {
                    login()
                }
            } catch (error) {
                console.error('Authentication failed:', error)
                clearAuthData()
                setAuthState({ token: null, refreshToken: null, isAuthenticated: false })
                login()
            } finally {
                setIsBootstrapping(false)
            }
        }

        bootstrap()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!env.enableSocket || !authState.token) return
        connectSocket(authState.token)
    }, [authState.token])

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'user_info_cache' && event.newValue) {
                window.location.reload()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const userInfoLoadedRef = useRef(false)

    // Single place that loads /me — runs once per session (userInfoLoadedRef guards it).
    useEffect(() => {
        if (!authState.token || isUserLoading || isAuthLoading) return

        const cachedUser = getUserInfoCache<UserInfo>()
        if (cachedUser?.permissions?.length) {
            userInfoLoadedRef.current = true
            return
        }

        if (userInfoLoadedRef.current) return
        // Mark attempted before awaiting so a failed /me doesn't re-trigger an infinite loop.
        userInfoLoadedRef.current = true

        fetchUserInfo()
            .then(fetchedUser => {
                if (!fetchedUser) return
                setUserInfoCache(fetchedUser)
                window.dispatchEvent(new Event('permissions-loaded'))
            })
            .catch(error => {
                // Keep the ref true (don't retry on failure) — surfaces the no-access / error UI.
                console.error('Failed to fetch user info:', error)
            })
    }, [authState.token, isUserLoading, isAuthLoading, fetchUserInfo])

    const isLoading = isBootstrapping || isAuthLoading || isUserLoading

    const value: AuthContextType = useMemo(
        () => ({
            isAuthenticated: authState.isAuthenticated,
            isLoading,
            user: user || null,
            userInfoError,
            token: authState.token,
            refreshToken: authState.refreshToken,
            login,
            logout,
            updateToken,
            hasRole,
            exchangeCodeForToken,
            fetchUserInfo,
            setAuthState,
        }),
        [
            authState.isAuthenticated,
            authState.token,
            authState.refreshToken,
            userInfoError,
            exchangeCodeForToken,
            fetchUserInfo,
            hasRole,
            isLoading,
            login,
            logout,
            setAuthState,
            updateToken,
            user,
        ],
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
            {forceLogoutRemaining !== null && (
                <LoadingOverlay
                    isLoading={true}
                    isFullScreen={true}
                    text={
                        getForceLogoutReason() === 'password-changed'
                            ? t('dashboardLayout.userMenu.changePasswordDialog.successMessage', {
                                  count: forceLogoutRemaining,
                              })
                            : t('common.sessionExpiredCountdown', { count: forceLogoutRemaining })
                    }
                >
                    {null}
                </LoadingOverlay>
            )}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const useUserInfo = useAuth

export default AuthProvider
