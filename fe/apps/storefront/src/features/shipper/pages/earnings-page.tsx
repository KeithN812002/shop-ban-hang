import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { BarChart } from '@/features/seller/components/bar-chart'
import { DateRangePicker } from '@/features/seller/components/date-range-picker'
import { KpiCard } from '@/features/seller/components/kpi-card'
import { rangeLastDays } from '@/features/seller/lib/dates'
import type { DateRangeParams } from '@/features/seller/types'
import { formatNumber, formatPrice } from '@/lib/format'
import { ShipperShell } from '../components/shipper-shell'
import { useShipperStats } from '../queries'

const periodLabel = (period: string): string => {
    const [, month, day] = period.slice(0, 10).split('-')
    return day && month ? `${day}/${month}` : period
}

export function EarningsPage() {
    const { t } = useTranslation()
    const [range, setRange] = useState<DateRangeParams>(() => rangeLastDays(7))
    const query = useShipperStats(range)
    const stats = query.data

    return (
        <ShipperShell title={t('shipper.earnings.title')}>
            <div className="rounded-xl border bg-white p-3">
                <DateRangePicker value={range} onChange={setRange} />
            </div>

            {query.isLoading && (
                <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}

            {stats && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <KpiCard highlight label={t('shipper.earnings.earnings')} value={formatPrice(stats.earnings)} />
                        </div>
                        <KpiCard label={t('shipper.earnings.cod')} value={formatPrice(stats.codCollected)} />
                        <KpiCard label={t('shipper.earnings.delivered')} value={formatNumber(stats.deliveredCount)} />
                        <KpiCard label={t('shipper.earnings.failed')} value={formatNumber(stats.failedCount)} />
                        <KpiCard label={t('shipper.earnings.returned')} value={formatNumber(stats.returnedCount)} />
                    </div>

                    <section className="rounded-xl border bg-white p-3">
                        <h2 className="mb-2 text-base font-semibold text-gray-800">{t('shipper.earnings.chart')}</h2>
                        {(stats.chart ?? []).length === 0 ? (
                            <EmptyState title={t('shipper.earnings.noData')} className="py-8" />
                        ) : (
                            <BarChart
                                ariaLabel={t('shipper.earnings.chart')}
                                formatValue={formatPrice}
                                data={stats.chart.map(point => ({
                                    label: periodLabel(point.period),
                                    value: point.earnings,
                                    tooltip: t('shipper.earnings.chartTooltip', {
                                        period: periodLabel(point.period),
                                        earnings: formatPrice(point.earnings),
                                        deliveries: point.deliveries,
                                    }),
                                }))}
                            />
                        )}
                    </section>
                </>
            )}
        </ShipperShell>
    )
}
