// Environment Configuration
export const env = {
    // Server
    serverPort: import.meta.env.FIS_SERVER_PORT,

    // API
    apiBaseUrl: import.meta.env.FIS_API_BASE_URL || '',
    appCode: import.meta.env.FIS_APP_CODE || '',
    publicUrl: import.meta.env.FIS_PUBLIC_URL || '',

    // Keycloak SSO
    ssoUrl: import.meta.env.FIS_SSO_URL || '',
    realm: import.meta.env.FIS_REALM || '',
    clientId: import.meta.env.FIS_CLIENT_ID || '',
    redirectUrl: import.meta.env.FIS_REDIRECT_URL || '',

    // Socket
    socketUrl: import.meta.env.FIS_SOCKET_URL || 'ws://localhost:3000',
    socketPath: import.meta.env.FIS_SOCKET_PATH || '/socket.io',

    // Feature Flags
    enableSocket: import.meta.env.FIS_ENABLE_SOCKET === 'true' || false,

    blockedFunctions: (import.meta.env.FIS_BLOCKED_FUNCTIONS || '')
        .split(',')
        .map(code => code.trim().toUpperCase())
        .filter(Boolean),

    // Environment
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    nodeEnv: import.meta.env.FIS_NODE_ENV || import.meta.env.MODE,

    // Build info (bơm từ vite.config.js lúc build)
    gitCommit: import.meta.env.FIS_GIT_COMMIT || 'dev',
    buildTime: import.meta.env.FIS_BUILD_TIME || '',
    // Nhãn môi trường: ưu tiên FIS_ENV_LABEL khai trong .env.<mode> (vd SIT/UAT/PROD),
    // không có thì lấy build mode (stagging/production/development).
    envLabel: import.meta.env.FIS_ENV_LABEL || import.meta.env.FIS_BUILD_MODE || import.meta.env.MODE,
} as const

export type Env = typeof env

// Single source of truth for the OAuth2 redirect_uri — MUST be identical at the
// authorize step and the code-exchange step, otherwise Keycloak rejects the exchange.
export const getCallbackRedirectUri = () => {
    if (env.redirectUrl) return env.redirectUrl

    const rawPublicUrl = env.publicUrl || ''
    let basepath = ''
    try {
        basepath = rawPublicUrl.startsWith('http') ? new URL(rawPublicUrl).pathname : rawPublicUrl
    } catch {
        basepath = rawPublicUrl
    }
    if (!basepath.startsWith('/')) basepath = '/' + basepath
    if (!basepath.endsWith('/')) basepath = basepath + '/'

    return `${window.location.origin}${basepath}api/sso/callback`
}

// App home URL — post-logout redirect target (app root re-initiates login, not the callback).
export const getAppHomeUri = () => {
    const rawPublicUrl = env.publicUrl || ''
    if (rawPublicUrl.startsWith('http')) return rawPublicUrl

    let basepath = rawPublicUrl
    if (basepath && !basepath.startsWith('/')) basepath = '/' + basepath
    return `${window.location.origin}${basepath}`
}

// Random hex string for the CSRF `state`. crypto.randomUUID() only exists in secure
// contexts (HTTPS or localhost); on plain HTTP it's undefined, so fall back to
// crypto.getRandomValues (available on HTTP too), then Math.random as a last resort.
const generateState = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    const bytes = new Uint8Array(16)
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        crypto.getRandomValues(bytes)
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// Keycloak Login Helper (Authorization Code flow)
// options.prompt='login' forces Keycloak to show the login form even when an SSO
// session is still active (used by the "back to login" recovery button).
export const redirectToKeycloakLogin = (options?: { prompt?: string }) => {
    const redirectUri = getCallbackRedirectUri()

    const state = generateState()
    sessionStorage.setItem('oauth_state', state)

    const params = new URLSearchParams({
        client_id: env.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state,
    })

    if (options?.prompt) {
        params.set('prompt', options.prompt)
    }

    window.location.href = `${env.ssoUrl}/realms/${env.realm}/protocol/openid-connect/auth?${params.toString()}`
}
