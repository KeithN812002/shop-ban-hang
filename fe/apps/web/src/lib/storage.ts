const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const ID_TOKEN_KEY = 'id_token'
// Absolute epoch-ms when the current access token expires (now + expiresIn). Drives the
// proactive refresh timer; cleared together with the tokens.
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'access_token_expires_at'
// Forced-logout countdown (shared by password-change and session-expired flows).
const FORCE_LOGOUT_START_KEY = 'force_logout_countdown_start'
const FORCE_LOGOUT_REASON_KEY = 'force_logout_reason'
const LANG_KEY = 'STORAGE_KEY_LANG'
const THEME_KEY = 'theme'
const USERNAME_KEY = 'username'
const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'
const USER_INFO_CACHE_KEY = 'user_info_cache' // Dùng localStorage để chia sẻ giữa các tabs

const removeLocalStorageKeys = (keys: string[]) => {
    keys.forEach(key => localStorage.removeItem(key))
}

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)

export const setAccessToken = (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const getRefreshToken = (): string | null => {
    const raw = localStorage.getItem(REFRESH_TOKEN_KEY)
    // Old sessions stored an undefined token as the literal string "undefined"/"null"
    // (the backend didn't return a refresh token then). Treat those as absent.
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return raw
}

export const setRefreshToken = (token: string | null | undefined): void => {
    if (!token) {
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        return
    }
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const getIdToken = (): string | null => localStorage.getItem(ID_TOKEN_KEY)

export const setIdToken = (token: string): void => {
    localStorage.setItem(ID_TOKEN_KEY, token)
}

export const getAccessTokenExpiresAt = (): number | null => {
    const raw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
    if (!raw) return null
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
}

// Store the absolute expiry derived from the OAuth `expiresIn` (seconds). Clears any previous
// value when expiresIn is absent/invalid so a stale (past) expiry can't make the proactive
// refresh timer fire in a tight loop.
export const setAccessTokenExpiresInSeconds = (expiresIn?: number | null): void => {
    if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
        localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
        return
    }
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresIn * 1000))
}

export const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ID_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
}

export type ForceLogoutReason = 'password-changed' | 'session-expired'

// Starts the 5s forced-logout countdown (rendered by AuthProvider). Idempotent: an already
// running countdown is left untouched so concurrent 401s don't reset the timer.
export const triggerForceLogout = (reason: ForceLogoutReason = 'session-expired'): void => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(FORCE_LOGOUT_START_KEY)) return
    localStorage.setItem(FORCE_LOGOUT_REASON_KEY, reason)
    localStorage.setItem(FORCE_LOGOUT_START_KEY, Date.now().toString())
    window.dispatchEvent(new Event('force-logout-countdown-start'))
}

export const getForceLogoutReason = (): ForceLogoutReason => {
    const raw = localStorage.getItem(FORCE_LOGOUT_REASON_KEY)
    return raw === 'password-changed' ? 'password-changed' : 'session-expired'
}

export const getForceLogoutStart = (): number | null => {
    const raw = localStorage.getItem(FORCE_LOGOUT_START_KEY)
    if (!raw) return null
    const parsed = parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
}

export const clearForceLogout = (): void => {
    localStorage.removeItem(FORCE_LOGOUT_START_KEY)
    localStorage.removeItem(FORCE_LOGOUT_REASON_KEY)
}

export const getLanguage = (): string => localStorage.getItem(LANG_KEY) || 'vi-VN'

export const setLanguage = (lang: string): void => {
    localStorage.setItem(LANG_KEY, lang)
}

export const getTheme = (): string | null => localStorage.getItem(THEME_KEY)

export const setTheme = (theme: string): void => {
    localStorage.setItem(THEME_KEY, theme)
}

export const getCachedUsername = (): string | null => sessionStorage.getItem(USERNAME_KEY)

export const setCachedUsername = (username: string): void => {
    sessionStorage.setItem(USERNAME_KEY, username)
}

export const clearCachedUserData = (): void => {
    sessionStorage.removeItem(USERNAME_KEY)
}

export const clearAuthData = (): void => {
    clearTokens()
    clearForceLogout()
    clearCachedUserData()
    clearUserInfoCache()

    // CSRF state + post-login redirect (sessionStorage)
    sessionStorage.removeItem('oauth_state')
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)

    // Legacy auth keys from the old OpenID build
    removeLocalStorageKeys(['authen-data', 'authen-token', 'user'])
}

export const clearLocalStorageAuth = (): void => {
    removeLocalStorageKeys([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ID_TOKEN_KEY, 'authen-data', 'authen-token', 'user'])
}

export const setPostLoginRedirect = (url: string): void => {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, url)
}

export const getPostLoginRedirect = (): string | null => {
    return sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
}

export const clearPostLoginRedirect = (): void => {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
}

export const setUserInfoCache = (user: unknown): void => {
    localStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify(user))
}

export const getUserInfoCache = <T = any>(): T | null => {
    const raw = localStorage.getItem(USER_INFO_CACHE_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export const clearUserInfoCache = (): void => {
    localStorage.removeItem(USER_INFO_CACHE_KEY)
}
