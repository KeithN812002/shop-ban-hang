import { Link } from '@tanstack/react-router'
import { Ban, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { buttonClass } from '@/components/ui/button'
import type { PartnerRole } from '@/components/auth/role-gate'
import type { RegistrationStatus } from '@/types/shop'

const icons = { PENDING: Clock, REJECTED: XCircle, SUSPENDED: Ban, ACTIVE: Clock } as const
const tones = {
    PENDING: 'text-amber-500',
    REJECTED: 'text-red-500',
    SUSPENDED: 'text-gray-500',
    ACTIVE: 'text-emerald-500',
} as const

/** Shown instead of the registration form once a request exists (PENDING / REJECTED / SUSPENDED). */
export function RegistrationStatusCard({ role, status }: { role: PartnerRole; status: RegistrationStatus }) {
    const { t } = useTranslation()
    const Icon = icons[status]
    return (
        <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
            <Icon className={`mx-auto size-14 ${tones[status]}`} aria-hidden />
            <h1 className="mt-4 text-xl font-bold text-gray-900">{t(`registration.${role}.${status}.title`)}</h1>
            <p className="mt-2 text-sm text-gray-600">{t(`registration.${role}.${status}.description`)}</p>
            <Link to="/" className={buttonClass({ variant: 'outline', className: 'mt-6' })}>
                {t('common.backHome')}
            </Link>
        </div>
    )
}
