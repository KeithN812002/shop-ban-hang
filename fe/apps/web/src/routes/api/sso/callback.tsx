import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, LogIn } from 'lucide-react'

import { useAuth } from '@/providers/AuthProvider'
import { env } from '@/config/env'
import { connectSocket } from '@/lib/socket'
import { clearAuthData, clearPostLoginRedirect, getPostLoginRedirect, getAccessToken } from '@/lib/storage'
import { keycloakHelpers } from '@/lib/keycloak'
import { Button } from '@workspace/ui/components/Button'

export const Route = createFileRoute('/api/sso/callback')({
    component: SsoCallbackPage,
})

function SsoCallbackPage() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { exchangeCodeForToken, setAuthState } = useAuth()
    const isHandledRef = useRef(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    const { code, state } = useMemo(() => {
        const urlParams = new URLSearchParams(window.location.search)
        return { code: urlParams.get('code'), state: urlParams.get('state') }
    }, [])

    useEffect(() => {
        if (isHandledRef.current) return
        isHandledRef.current = true

        const goToApp = () => {
            let redirectUrl = getPostLoginRedirect() || '/modules'
            clearPostLoginRedirect()

            // Only allow internal paths (prevent open redirect): a single leading '/',
            // not a protocol-relative '//', and not the callback page itself.
            if (
                !redirectUrl.startsWith('/') ||
                redirectUrl.startsWith('//') ||
                redirectUrl.includes('/api/sso/callback')
            ) {
                redirectUrl = '/modules'
            }

            navigate({ to: redirectUrl, replace: true })
        }

        // Already authenticated — typically an F5 after the exchange already succeeded. Don't
        // re-consume the single-use code (which would fail); just continue into the app.
        if (getAccessToken()) {
            goToApp()
            return
        }

        // A callback this tab didn't initiate (no code, or a `state` we never stored) — e.g. the
        // auto-login Keycloak performs after a password reset, opened from the email link in a
        // fresh context that has no `oauth_state`. Don't dead-end on an error screen: re-initiate
        // login. Keycloak already has the session, so it's a silent SSO round-trip that returns
        // with a matching state and completes the exchange.
        if (!code) {
            keycloakHelpers.login()
            return
        }

        // CSRF: the `state` from Keycloak must match the one we stored. Keep it (and the code in
        // the URL) until the exchange SUCCEEDS, so an F5 mid-exchange can retry with the same
        // still-valid code instead of dropping the user back to login.
        const storedState = sessionStorage.getItem('oauth_state')
        if (!storedState || state !== storedState) {
            keycloakHelpers.login()
            return
        }

        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 6, 85))
        }, 300)

        const handleCallback = async () => {
            // Only the token exchange maps to the error message; /me is loaded by AuthProvider.
            try {
                await exchangeCodeForToken(code)
            } catch (error) {
                console.error('SSO token exchange failed:', error)
                // Terminal: the code is consumed/expired/invalid — clear the CSRF state and the
                // code from the URL, then surface the re-login screen.
                sessionStorage.removeItem('oauth_state')
                window.history.replaceState(null, '', window.location.pathname)
                clearAuthData()
                setAuthState({ token: null, refreshToken: null, isAuthenticated: false })
                setErrorMessage(t('dynamicRoute.ssoCallback.errors.tokenExchangeFailed'))
                setProgress(0)
                clearInterval(progressInterval)
                return
            }

            // Success → now it's safe to consume the CSRF state and strip the code from the URL.
            sessionStorage.removeItem('oauth_state')
            window.history.replaceState(null, '', window.location.pathname)

            clearInterval(progressInterval)
            setProgress(100)

            const accessToken = getAccessToken()
            if (env.enableSocket && accessToken) {
                connectSocket(accessToken)
            }

            goToApp()
        }

        handleCallback()
    }, [code, state, exchangeCodeForToken, navigate, setAuthState, t])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl border-2 border-slate-400/40 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
                {errorMessage ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <ShieldAlert className="h-8 w-8 text-red-500" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">
                                {t('dynamicRoute.ssoCallback.errorTitle')}
                            </h1>
                            <p className="mt-2 text-base text-pretty text-slate-600">{errorMessage}</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="xl"
                            className="w-full"
                            onClick={() => keycloakHelpers.login({ prompt: 'login' })}
                        >
                            {t('dynamicRoute.ssoCallback.backToLogin')}
                            <LogIn />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img src="/images/logo.svg" alt="Logo" className="h-14 w-14" />
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {t('dynamicRoute.ssoCallback.authenticatingTitle')}
                                </h1>
                                <p className="text-sm text-slate-500">{t('dynamicRoute.ssoCallback.pleaseWait')}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>{t('dynamicRoute.ssoCallback.progressLabel')}</span>
                                <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
