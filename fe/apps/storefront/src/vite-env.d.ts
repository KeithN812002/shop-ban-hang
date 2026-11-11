/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly FIS_SERVER_PORT?: string
    readonly FIS_API_BASE_URL?: string
    readonly FIS_API_PREFIX?: string
    readonly FIS_SSO_URL?: string
    readonly FIS_REALM?: string
    readonly FIS_CLIENT_ID?: string
    readonly FIS_REDIRECT_URL?: string
    readonly FIS_AR_WASM_URL?: string
    readonly FIS_AR_FACE_MODEL_URL?: string
    readonly FIS_AR_POSE_MODEL_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

/** Injected by vite.config.js: installed @mediapipe/tasks-vision version. */
declare const __MEDIAPIPE_VERSION__: string
