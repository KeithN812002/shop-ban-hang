// Single place that reads import.meta.env (FIS_* keys, values live in .env, never committed).
const trimSlash = (value: string): string => value.replace(/\/+$/, '')

export const env = {
    /** Prefix the browser calls; the dev server proxy / reverse proxy maps it to the backend. */
    apiPrefix: trimSlash(import.meta.env.FIS_API_PREFIX || '/api'),

    // Keycloak SSO
    ssoUrl: trimSlash(import.meta.env.FIS_SSO_URL || ''),
    realm: import.meta.env.FIS_REALM || '',
    clientId: import.meta.env.FIS_CLIENT_ID || '',
    redirectUrl: import.meta.env.FIS_REDIRECT_URL || '',

    // AR try-on assets (wasm must match the installed @mediapipe/tasks-vision version)
    arWasmUrl:
        import.meta.env.FIS_AR_WASM_URL ||
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${__MEDIAPIPE_VERSION__}/wasm`,
    arFaceModelUrl:
        import.meta.env.FIS_AR_FACE_MODEL_URL ||
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    arPoseModelUrl:
        import.meta.env.FIS_AR_POSE_MODEL_URL ||
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
} as const

export const isSsoConfigured = (): boolean => Boolean(env.ssoUrl && env.realm && env.clientId)

/** OAuth redirect_uri: MUST be identical at the authorize step and at the code exchange. */
export const getCallbackRedirectUri = (): string =>
    env.redirectUrl || `${window.location.origin}/auth/callback`

export const getAppHomeUri = (): string => `${window.location.origin}/`

const randomState = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

const OAUTH_STATE_KEY = 'oauth_state'

/** Starts the Keycloak authorization-code flow. */
export const redirectToKeycloakLogin = (options?: { prompt?: string }): void => {
    const state = randomState()
    sessionStorage.setItem(OAUTH_STATE_KEY, state)

    const params = new URLSearchParams({
        client_id: env.clientId,
        redirect_uri: getCallbackRedirectUri(),
        response_type: 'code',
        scope: 'openid profile email',
        state,
    })
    if (options?.prompt) params.set('prompt', options.prompt)

    window.location.href = `${env.ssoUrl}/realms/${env.realm}/protocol/openid-connect/auth?${params.toString()}`
}
