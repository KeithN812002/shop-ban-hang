import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { exchangeAuthCode, logoutApi } from '@/features/auth/api'
import { getCallbackRedirectUri } from '@/config/env'
import { keycloakHelpers } from '@/lib/keycloak'
import { subscribeAuthChanged, notifyAuthChanged } from '@/lib/auth-events'
import {
    clearAuthData,
    getAccessToken,
    getIdToken,
    getRefreshToken,
    setAccessToken,
    setIdToken,
    setRefreshToken,
} from '@/lib/storage'

interface AuthContextValue {
    isAuthenticated: boolean
    /** Redirects to Keycloak; `redirectTo` is the in-app path to return to. */
    login: (redirectTo?: string) => void
    logout: () => Promise<void>
    exchangeCodeForToken: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAccessToken()))

    const dropSession = useCallback(() => {
        clearAuthData()
        setIsAuthenticated(false)
        queryClient.removeQueries({ queryKey: ['me'] })
    }, [queryClient])

    useEffect(() => {
        const unsubscribe = subscribeAuthChanged(reason => {
            if (reason === 'expired' || reason === 'logout') dropSession()
            else setIsAuthenticated(Boolean(getAccessToken()))
        })
        // Other tab logged in/out.
        const onStorage = (event: StorageEvent) => {
            if (event.key === 'access_token') setIsAuthenticated(Boolean(event.newValue))
        }
        window.addEventListener('storage', onStorage)
        return () => {
            unsubscribe()
            window.removeEventListener('storage', onStorage)
        }
    }, [dropSession])

    const exchangeCodeForToken = useCallback(
        async (code: string) => {
            const tokens = await exchangeAuthCode(code, getCallbackRedirectUri())
            setAccessToken(tokens.accessToken)
            setRefreshToken(tokens.refreshToken)
            if (tokens.idToken) setIdToken(tokens.idToken)
            setIsAuthenticated(true)
            await queryClient.invalidateQueries({ queryKey: ['me'] })
            notifyAuthChanged('login')
        },
        [queryClient],
    )

    const logout = useCallback(async () => {
        const idToken = getIdToken()
        await logoutApi(getRefreshToken())
        // Only wipe storage: the Keycloak redirect reloads the app anyway. Flipping isAuthenticated here would
        // re-render a guarded page, whose RequireAuth would start a Keycloak *login* that overrides this logout.
        clearAuthData()
        keycloakHelpers.logout(idToken)
    }, [])

    const login = useCallback((redirectTo?: string) => keycloakHelpers.login(redirectTo), [])

    const value = useMemo<AuthContextValue>(
        () => ({ isAuthenticated, login, logout, exchangeCodeForToken }),
        [isAuthenticated, login, logout, exchangeCodeForToken],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}
