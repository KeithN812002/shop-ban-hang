import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { ErrorState } from '@/components/ui/feedback'
import { ShipperShell } from '../components/shipper-shell'
import { useShipperProfile } from '../queries'

/** ID number is personal data: only the last 3 characters are shown. */
const maskId = (value: string): string => (value.length > 3 ? `${'•'.repeat(value.length - 3)}${value.slice(-3)}` : value)

export function ProfilePage() {
    const { t } = useTranslation()
    const query = useShipperProfile()
    const profile = query.data

    const rows = profile
        ? [
              ['fullName', profile.fullName],
              ['username', profile.username],
              ['phone', profile.phone],
              ['idNumber', maskId(profile.idNumber ?? '')],
              ['vehicleType', profile.vehicleType],
              ['vehiclePlate', profile.vehiclePlate],
              ['areaProvince', profile.areaProvince],
          ]
        : []

    return (
        <ShipperShell title={t('shipper.profile.title')}>
            {query.isLoading && <Skeleton className="h-72 w-full rounded-xl" />}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {profile && (
                <section className="rounded-xl border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-gray-800">{t('shipper.profile.info')}</h2>
                        <span
                            className={
                                profile.status === 'ACTIVE'
                                    ? 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700'
                                    : 'rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700'
                            }
                        >
                            {t(`shipper.profile.status.${profile.status}`)}
                        </span>
                    </div>
                    <dl className="divide-y text-sm">
                        {rows.map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-4 py-2">
                                <dt className="text-gray-500">{t(`shipper.profile.fields.${key}`)}</dt>
                                <dd className="text-right font-medium text-gray-900">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                    {profile.rejectReason && (
                        <p className="mt-3 text-sm text-red-600">{t('shipper.profile.reason', { reason: profile.rejectReason })}</p>
                    )}
                </section>
            )}
        </ShipperShell>
    )
}
