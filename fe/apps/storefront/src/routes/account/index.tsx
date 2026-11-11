import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { buttonClass } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { useProfile } from '@/hooks/use-profile'

export const Route = createFileRoute('/account/')({ component: ProfilePage })

function ProfilePage() {
    const { t } = useTranslation()
    const { profile, isLoading, isError, refetch, storeStatus, shipperStatus, isSeller, isShipper } = useProfile()

    if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />
    if (isError || !profile) return <ErrorState onRetry={refetch} />

    const rows: Array<[string, string]> = [
        [t('account.profile.fullName'), profile.fullName],
        [t('account.profile.username'), profile.username],
        [t('account.profile.email'), profile.email],
    ]

    return (
        <div className="space-y-4">
            <section className="rounded-xl bg-white p-5" aria-label={t('account.menu.profile')}>
                <h1 className="mb-4 text-lg font-bold text-gray-900">{t('account.menu.profile')}</h1>
                <dl className="divide-y">
                    {rows.map(([label, value]) => (
                        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
                            <dt className="text-sm text-gray-500">{label}</dt>
                            <dd className="text-sm font-medium text-gray-900">{value}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-5">
                    <h2 className="font-semibold text-gray-900">{t('account.profile.sellerTitle')}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {storeStatus ? t(`account.registrationStatus.${storeStatus}`) : t('account.profile.notSeller')}
                    </p>
                    <Link
                        to={isSeller ? '/seller' : '/seller/register'}
                        className={buttonClass({ variant: 'soft', size: 'sm', className: 'mt-3' })}
                    >
                        {isSeller ? t('header.sellerCenter') : t('account.profile.registerSeller')}
                    </Link>
                </div>
                <div className="rounded-xl bg-white p-5">
                    <h2 className="font-semibold text-gray-900">{t('account.profile.shipperTitle')}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        {shipperStatus
                            ? t(`account.registrationStatus.${shipperStatus}`)
                            : t('account.profile.notShipper')}
                    </p>
                    <Link
                        to={isShipper ? '/shipper' : '/shipper/register'}
                        className={buttonClass({ variant: 'soft', size: 'sm', className: 'mt-3' })}
                    >
                        {isShipper ? t('header.shipper') : t('account.profile.registerShipper')}
                    </Link>
                </div>
            </section>
        </div>
    )
}
