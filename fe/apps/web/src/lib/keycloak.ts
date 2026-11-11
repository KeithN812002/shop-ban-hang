import { env, redirectToKeycloakLogin, getAppHomeUri } from '@/config/env'
import { setPostLoginRedirect, getIdToken } from '@/lib/storage'

const setRedirectPath = () => {
    if (typeof window === 'undefined') return
    setPostLoginRedirect('/modules')
}

// Post-logout lands on the app home (not the SSO callback, which expects an auth code).
const getPostLogoutRedirectUri = () => {
    return getAppHomeUri()
}

export const keycloakHelpers = {
    login: (options?: { prompt?: string }) => {
        setRedirectPath()
        redirectToKeycloakLogin(options)
    },

    /**
     * `capturedIdToken`: pass the id token read before the local session was cleared. Without an
     * `id_token_hint` Keycloak stops on its "Do you want to log out?" confirmation page.
     */
    logout: (capturedIdToken?: string | null) => {
        sessionStorage.removeItem('oauth_state')

        // No SSO configured (e.g. local dev) — hard-redirect home so the app re-bootstraps
        // instead of freezing on a blank/expired screen after auth data is cleared.
        if (!env.ssoUrl || !env.realm) {
            window.location.href = getAppHomeUri()
            return
        }

        const idToken = capturedIdToken ?? getIdToken()
        const params = new URLSearchParams()
        if (idToken) {
            params.append('id_token_hint', idToken)
            params.append('post_logout_redirect_uri', getPostLogoutRedirectUri())
        } else {
            params.append('client_id', env.clientId)
            params.append('post_logout_redirect_uri', getPostLogoutRedirectUri())
        }

        window.location.href = `${env.ssoUrl}/realms/${env.realm}/protocol/openid-connect/logout?${params.toString()}`
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token')
    },
}

export default keycloakHelpers
