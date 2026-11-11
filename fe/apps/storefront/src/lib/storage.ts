// All browser storage access goes through this module (never touch localStorage elsewhere).
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const ID_TOKEN_KEY = 'id_token'
const LANG_KEY = 'STORAGE_KEY_LANG'
const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect'
const OAUTH_STATE_KEY = 'oauth_state'
const CHATBOT_KEY = 'storefront_chatbot_messages'

const safeParse = <T>(raw: string | null): T | null => {
    if (!raw) return null
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)
export const setAccessToken = (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token)

export const getRefreshToken = (): string | null => {
    const raw = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return raw
}
export const setRefreshToken = (token: string | null | undefined): void => {
    if (!token) localStorage.removeItem(REFRESH_TOKEN_KEY)
    else localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const getIdToken = (): string | null => localStorage.getItem(ID_TOKEN_KEY)
export const setIdToken = (token: string): void => localStorage.setItem(ID_TOKEN_KEY, token)

export const clearTokens = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ID_TOKEN_KEY)
}

/** Clears tokens plus transient OAuth data. */
export const clearAuthData = (): void => {
    clearTokens()
    sessionStorage.removeItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
}

export const getOAuthState = (): string | null => sessionStorage.getItem(OAUTH_STATE_KEY)
export const clearOAuthState = (): void => sessionStorage.removeItem(OAUTH_STATE_KEY)

export const getLanguage = (): string => localStorage.getItem(LANG_KEY) || 'vi-VN'
export const setLanguage = (lang: string): void => localStorage.setItem(LANG_KEY, lang)

export const setPostLoginRedirect = (url: string): void => sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, url)
export const getPostLoginRedirect = (): string | null => sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
export const clearPostLoginRedirect = (): void => sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)

/** Chatbot history lives in sessionStorage so it dies with the tab. */
export const loadChatbotMessages = <T>(): T[] => safeParse<T[]>(sessionStorage.getItem(CHATBOT_KEY)) ?? []
export const saveChatbotMessages = <T>(messages: T[]): void => {
    try {
        sessionStorage.setItem(CHATBOT_KEY, JSON.stringify(messages))
    } catch {
        // Storage full / disabled: the in-memory history keeps working.
    }
}
export const clearChatbotMessages = (): void => sessionStorage.removeItem(CHATBOT_KEY)
