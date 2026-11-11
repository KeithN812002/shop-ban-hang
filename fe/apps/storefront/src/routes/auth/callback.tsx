import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LogIn, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { keycloakHelpers, sanitizeRedirect } from '@/lib/keycloak'
import {
    clearAuthData,
    clearOAuthState,
    clearPostLoginRedirect,
    getAccessToken,
    getOAuthState,
    getPostLoginRedirect,
} from '@/lib/storage'
import { useAuth } from '@/providers/auth-provider'

export const Route = createFileRoute('/auth/callback')({ component: SsoCallbackPage })

/** Keycloak redirect target: validates `state`, exchanges the code via the backend, then returns to the app. */
function SsoCallbackPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { exchangeCodeForToken } = useAuth()
    const handled = useRef(false)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (handled.current) return
        handled.current = true

        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        const goToApp = () => {
            const target = sanitizeRedirect(getPostLoginRedirect())
            clearPostLoginRedirect()
            router.history.replace(target)
        }

        // Reload after a successful exchange: the single-use code must not be consumed twice.
        if (getAccessToken()) {
            goToApp()
            return
        }

        // Callback this tab never initiated (no code / unknown state): start a fresh login.
        const storedState = getOAuthState()
        if (!code || !storedState || state !== storedState) {
            keycloakHelpers.login(getPostLoginRedirect() ?? '/')
            return
        }

        exchangeCodeForToken(code)
            .then(() => {
                clearOAuthState()
                window.history.replaceState(null, '', window.location.pathname)
                goToApp()
            })
            .catch((error: unknown) => {
                console.error('SSO token exchange failed', error)
                clearAuthData()
                window.history.replaceState(null, '', window.location.pathname)
                setFailed(true)
            })
    }, [exchangeCodeForToken, router])

    return (
        <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
            <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
                {failed ? (
                    <>
                        <ShieldAlert className="mx-auto mb-3 size-12 text-red-500" aria-hidden />
                        <h1 className="text-lg font-semibold">{t('auth.callbackFailedTitle')}</h1>
                        <p className="mt-2 text-sm text-gray-600">{t('auth.callbackFailed')}</p>
                        <Button
                            className="mt-5"
                            icon={<LogIn />}
                            onClick={() => keycloakHelpers.login('/', { prompt: 'login' })}
                        >
                            {t('auth.backToLogin')}
                        </Button>
                    </>
                ) : (
                    <>
                        <Spinner className="mx-auto size-10" />
                        <h1 className="mt-4 text-lg font-semibold">{t('auth.authenticating')}</h1>
                        <p className="mt-1 text-sm text-gray-500">{t('auth.pleaseWait')}</p>
                    </>
                )}
            </div>
        </div>
    )
}
