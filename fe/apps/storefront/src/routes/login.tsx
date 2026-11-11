import { useEffect, useRef } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageSpinner } from '@/components/ui/feedback'
import { isSsoConfigured } from '@/config/env'
import { sanitizeRedirect } from '@/lib/keycloak'
import { useAuth } from '@/providers/auth-provider'

export const Route = createFileRoute('/login')({
    validateSearch: (raw: Record<string, unknown>): { redirect?: string } => ({
        redirect: typeof raw.redirect === 'string' ? raw.redirect : undefined,
    }),
    component: LoginPage,
})

/** Immediately forwards to Keycloak; shows a manual button only when SSO is not configured. */
function LoginPage() {
    const { t } = useTranslation()
    const { redirect } = Route.useSearch()
    const { isAuthenticated, login } = useAuth()
    const router = useRouter()
    const started = useRef(false)
    const target = sanitizeRedirect(redirect)

    useEffect(() => {
        if (started.current) return
        if (isAuthenticated) {
            started.current = true
            router.history.replace(target)
            return
        }
        if (isSsoConfigured()) {
            started.current = true
            login(target)
        }
    }, [isAuthenticated, login, router, target])

    if (!isSsoConfigured() && !isAuthenticated) {
        return (
            <div className="container-page py-16">
                <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
                    <LogIn className="mx-auto mb-3 size-10 text-brand-500" aria-hidden />
                    <h1 className="text-lg font-semibold">{t('auth.ssoNotConfiguredTitle')}</h1>
                    <p className="mt-2 text-sm text-gray-600">{t('auth.ssoNotConfigured')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container-page">
            <PageSpinner />
            <p className="-mt-24 text-center text-sm text-gray-500">{t('auth.redirecting')}</p>
            <div className="mt-24 flex justify-center">
                <Button variant="outline" onClick={() => login(target)}>
                    {t('auth.continue')}
                </Button>
            </div>
        </div>
    )
}
