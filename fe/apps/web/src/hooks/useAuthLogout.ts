import { useCallback, useState } from 'react'
import { useLogout } from '@/services/auth'
import { keycloakHelpers } from '@/lib/keycloak'
import { disconnectSocket } from '@/lib/socket'
import { clearAuthData, getIdToken } from '@/lib/storage'
import { env } from '@/config/env'
import { useAuth } from '@/providers/AuthProvider'

interface UseAuthLogoutOptions {
    onSuccess?: () => void
    onError?: (error: Error) => void
}

export function useAuthLogout(options: UseAuthLogoutOptions = {}) {
    const { refreshToken } = useAuth()
    const logoutMutation = useLogout()
    // Stays true until the full-page redirect so the loading UI doesn't flash back.
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const { onSuccess, onError } = options

    const logout = useCallback(async () => {
        setIsLoggingOut(true)
        try {
            if (env.enableSocket) {
                disconnectSocket()
            }

            const currentRefreshToken = refreshToken
            try {
                await logoutMutation.mutateAsync(currentRefreshToken || undefined)
            } catch (logoutError) {
                console.warn('Logout API failed, continuing with local cleanup:', logoutError)
            }

            // clearAuthData() wipes the id token, and Keycloak needs it as id_token_hint to log out
            // without its confirmation page.
            const idToken = getIdToken()
            clearAuthData()
            onSuccess?.()

            // End the Keycloak SSO session (not re-login) so the user isn't silently re-authed.
            keycloakHelpers.logout(idToken)
        } catch (error) {
            setIsLoggingOut(false)
            console.error('Logout failed:', error)

            const err = error instanceof Error ? error : new Error('Unknown error')
            onError?.(err)

            throw error
        }
    }, [refreshToken, logoutMutation, onSuccess, onError])

    return {
        logout,
        isLoading: isLoggingOut || logoutMutation.isPending,
        isSuccess: logoutMutation.isSuccess,
        isError: logoutMutation.isError,
        error: logoutMutation.error,
    }
}
