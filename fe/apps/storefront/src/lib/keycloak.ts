import { getAppHomeUri, env, isSsoConfigured, redirectToKeycloakLogin } from '@/config/env'
import { clearOAuthState, setPostLoginRedirect } from '@/lib/storage'

/** Only same-origin absolute paths are valid post-login targets (no open redirect). */
export const sanitizeRedirect = (target: string | null | undefined): string => {
    if (!target) return '/'
    if (!target.startsWith('/') || target.startsWith('//') || target.includes('/auth/callback')) return '/'
    return target
}

export const keycloakHelpers = {
    login: (redirectTo?: string, options?: { prompt?: string }): void => {
        setPostLoginRedirect(sanitizeRedirect(redirectTo))
        redirectToKeycloakLogin(options)
    },

    /** `idToken` must be captured before the local session is wiped. */
    logout: (idToken?: string | null): void => {
        clearOAuthState()
        if (!isSsoConfigured()) {
            window.location.href = getAppHomeUri()
            return
        }
        const params = new URLSearchParams({ post_logout_redirect_uri: getAppHomeUri() })
        if (idToken) params.append('id_token_hint', idToken)
        else params.append('client_id', env.clientId)
        window.location.href = `${env.ssoUrl}/realms/${env.realm}/protocol/openid-connect/logout?${params.toString()}`
    },
}
