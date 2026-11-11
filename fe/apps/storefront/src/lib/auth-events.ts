// Tiny pub/sub between the http layer (no React) and the AuthProvider.
export type AuthChangeReason = 'login' | 'refreshed' | 'logout' | 'expired'

const EVENT_NAME = 'storefront-auth-changed'

export const notifyAuthChanged = (reason: AuthChangeReason): void => {
    window.dispatchEvent(new CustomEvent<AuthChangeReason>(EVENT_NAME, { detail: reason }))
}

export const subscribeAuthChanged = (listener: (reason: AuthChangeReason) => void): (() => void) => {
    const handler = (event: Event) => listener((event as CustomEvent<AuthChangeReason>).detail)
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
}
