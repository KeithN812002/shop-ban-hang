import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RequireAuth } from '@/components/auth/require-auth'
import { buttonClass } from '@/components/ui/button'

export const Route = createFileRoute('/checkout/success')({
    validateSearch: (raw: Record<string, unknown>): { codes?: string } => ({
        codes: raw.codes === undefined || raw.codes === null ? undefined : String(raw.codes),
    }),
    component: () => (
        <RequireAuth>
            <SuccessPage />
        </RequireAuth>
    ),
})

function SuccessPage() {
    const { t } = useTranslation()
    const { codes } = Route.useSearch()
    const list = (codes ?? '').split(',').filter(Boolean)
    return (
        <div className="container-page py-10">
            <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
                <CheckCircle2 className="mx-auto size-16 text-emerald-500" aria-hidden />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('checkout.successTitle')}</h1>
                <p className="mt-2 text-sm text-gray-600">{t('checkout.successHint')}</p>
                {list.length > 0 && (
                    <ul className="mt-4 space-y-1">
                        {list.map(code => (
                            <li key={code} className="rounded-md bg-gray-50 px-3 py-2 font-mono text-sm font-semibold">
                                {code}
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/account/orders" className={buttonClass()}>
                        {t('checkout.viewOrders')}
                    </Link>
                    <Link to="/" className={buttonClass({ variant: 'outline' })}>
                        {t('cart.continueShopping')}
                    </Link>
                </div>
            </div>
        </div>
    )
}
