/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Server
    readonly FIS_SERVER_PORT: string

    // API
    readonly FIS_API_BASE_URL: string
    readonly FIS_APP_CODE: string
    readonly FIS_PUBLIC_URL: string

    // Keycloak SSO
    readonly FIS_SSO_URL: string
    readonly FIS_REALM: string
    readonly FIS_CLIENT_ID: string
    readonly FIS_REDIRECT_URL: string

    // Socket
    readonly FIS_SOCKET_URL: string
    readonly FIS_SOCKET_PATH: string

    // Feature Flags
    readonly FIS_ENABLE_SOCKET: string

    readonly FIS_BLOCKED_FUNCTIONS: string

    // Environment
    readonly FIS_NODE_ENV: string

    // Build info (injected by vite.config.js)
    readonly FIS_GIT_COMMIT: string
    readonly FIS_BUILD_TIME: string
    readonly FIS_BUILD_MODE: string
    // Nhãn môi trường tùy chọn, khai trong .env.<mode> (vd SIT/UAT/PROD)
    readonly FIS_ENV_LABEL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
