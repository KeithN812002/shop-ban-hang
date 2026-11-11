import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Ban, Banknote, Boxes, Eye, PackageCheck, ReceiptText, Star, Truck, Hourglass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { TabBar } from '@/components/ui/tab-bar'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { SmartImage } from '@/components/ui/smart-image'
import { formatNumber, formatPrice } from '@/lib/format'
import type { OrderStatus } from '@/types/shop'
import { BarChart } from '../components/bar-chart'
import { DateRangePicker } from '../components/date-range-picker'
import { KpiCard } from '../components/kpi-card'
import { SellerShell } from '../components/seller-shell'
import { rangeLastDays } from '../lib/dates'
import { useOrderCount, useOverview, useRevenueChart, useTopProducts } from '../queries'
import type { ChartGroupBy, DateRangeParams } from '../types'

const periodLabel = (period: string, groupBy: ChartGroupBy): string => {
    const [year, month, day] = period.slice(0, 10).split('-')
    if (groupBy === 'MONTH') return month && year ? `${month}/${year}` : period
    return day && month ? `${day}/${month}` : period
}

function TodoCard({ status, label }: { status: OrderStatus; label: string }) {
    const count = useOrderCount(status)
    return (
        <Link to="/seller/orders" search={{ status }} className="block">
            <KpiCard
                interactive
                highlight={(count.data ?? 0) > 0}
                label={label}
                value={count.isLoading ? <Skeleton className="h-8 w-12" /> : formatNumber(count.data ?? 0)}
            />
        </Link>
    )
}

export function DashboardPage() {
    const { t } = useTranslation()
    const [range, setRange] = useState<DateRangeParams>(() => rangeLastDays(30))
    const [groupBy, setGroupBy] = useState<ChartGroupBy>('DAY')

    const overview = useOverview(range)
    const chart = useRevenueChart(range, groupBy)
    const top = useTopProducts(range, 5)

    const kpis = overview.data
        ? [
              { key: 'revenue', icon: <Banknote />, value: formatPrice(overview.data.revenue), highlight: true },
              { key: 'orders', icon: <ReceiptText />, value: formatNumber(overview.data.orderCount) },
              { key: 'pending', icon: <Hourglass />, value: formatNumber(overview.data.pendingCount) },
              { key: 'toShip', icon: <Truck />, value: formatNumber(overview.data.toShipCount) },
              { key: 'cancelled', icon: <Ban />, value: formatNumber(overview.data.cancelledCount) },
              { key: 'products', icon: <Boxes />, value: formatNumber(overview.data.productCount) },
              { key: 'rating', icon: <Star />, value: (overview.data.ratingAvg ?? 0).toFixed(1) },
              { key: 'views', icon: <Eye />, value: formatNumber(overview.data.viewCount) },
          ]
        : []

    return (
        <SellerShell title={t('seller.dashboard.title')}>
            <div className="rounded-xl border bg-white p-4">
                <DateRangePicker value={range} onChange={setRange} />
            </div>

            <section aria-label={t('seller.dashboard.todo')} className="space-y-2">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <PackageCheck className="size-4 text-brand-500" aria-hidden />
                    {t('seller.dashboard.todo')}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <TodoCard status="PENDING" label={t('seller.dashboard.todoPending')} />
                    <TodoCard status="CONFIRMED" label={t('seller.dashboard.todoConfirmed')} />
                    <TodoCard status="READY_TO_SHIP" label={t('seller.dashboard.todoReady')} />
                </div>
            </section>

            {overview.isError ? (
                <ErrorState onRetry={() => void overview.refetch()} />
            ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {overview.isLoading
                        ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                        : kpis.map(kpi => (
                              <KpiCard
                                  key={kpi.key}
                                  label={t(`seller.dashboard.kpi.${kpi.key}`)}
                                  value={kpi.value}
                                  icon={kpi.icon}
                                  highlight={kpi.highlight}
                              />
                          ))}
                </div>
            )}

            <section className="rounded-xl border bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-gray-800">{t('seller.dashboard.revenueChart')}</h2>
                    <TabBar<ChartGroupBy>
                        ariaLabel={t('seller.dashboard.groupBy')}
                        value={groupBy}
                        onChange={setGroupBy}
                        tabs={[
                            { value: 'DAY', label: t('seller.dashboard.byDay') },
                            { value: 'MONTH', label: t('seller.dashboard.byMonth') },
                        ]}
                    />
                </div>
                {chart.isLoading && <Skeleton className="h-60 w-full" />}
                {chart.isError && <ErrorState onRetry={() => void chart.refetch()} />}
                {chart.data &&
                    (chart.data.length === 0 ? (
                        <EmptyState title={t('seller.dashboard.noChartData')} className="py-8" />
                    ) : (
                        <BarChart
                            ariaLabel={t('seller.dashboard.revenueChart')}
                            formatValue={formatPrice}
                            data={chart.data.map(point => ({
                                label: periodLabel(point.period, groupBy),
                                value: point.revenue,
                                tooltip: t('seller.dashboard.chartTooltip', {
                                    period: periodLabel(point.period, groupBy),
                                    revenue: formatPrice(point.revenue),
                                    orders: point.orders,
                                }),
                            }))}
                        />
                    ))}
            </section>

            <section className="rounded-xl border bg-white p-4">
                <h2 className="mb-3 text-base font-semibold text-gray-800">{t('seller.dashboard.topProducts')}</h2>
                {top.isLoading && <Skeleton className="h-32 w-full" />}
                {top.isError && <ErrorState onRetry={() => void top.refetch()} />}
                {top.data &&
                    (top.data.length === 0 ? (
                        <EmptyState title={t('seller.dashboard.noTopProducts')} className="py-8" />
                    ) : (
                        <ol className="divide-y">
                            {top.data.map((product, index) => (
                                <li key={product.productId} className="flex items-center gap-3 py-2">
                                    <span className="w-5 text-center text-sm font-semibold text-gray-400">{index + 1}</span>
                                    <SmartImage
                                        src={product.thumbnailUrl}
                                        alt={product.name}
                                        className="size-12 shrink-0 rounded-md border object-cover"
                                    />
                                    <p className="line-clamp-2 min-w-0 flex-1 text-sm text-gray-800">{product.name}</p>
                                    <div className="shrink-0 text-right text-sm">
                                        <p className="font-semibold text-brand-600">{formatPrice(product.revenue)}</p>
                                        <p className="text-xs text-gray-500">
                                            {t('seller.dashboard.soldQty', { count: product.quantity })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ))}
            </section>
        </SellerShell>
    )
}
