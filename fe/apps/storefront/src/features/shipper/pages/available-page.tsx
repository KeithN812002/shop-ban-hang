import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, HandHelping, RefreshCw, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Select } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { PROVINCES } from '@/features/seller/lib/provinces'
import { OrderCard } from '../components/order-card'
import { ShipperShell } from '../components/shipper-shell'
import { useAcceptAction } from '../lib/use-accept-action'
import { useAvailableOrders, useMyOrders, useShipperProfile } from '../queries'
import { ACTIVE_ORDER_STATUSES, AVAILABLE_JOB_TYPES, type AvailableJobType } from '../types'

const PAGE_SIZE = 10

export function AvailablePage() {
    const { t } = useTranslation()
    // '' = the shipper's own area: the server applies it when no province is sent.
    const [province, setProvince] = useState('')
    const [type, setType] = useState<AvailableJobType>('ALL')
    const [page, setPage] = useState(1)
    const profile = useShipperProfile()
    const query = useAvailableOrders({ province: province || undefined, type, pageNumber: page, pageSize: PAGE_SIZE })
    const accept = useAcceptAction()
    // size-1 page: only totalElements is needed for the "orders to handle" banner.
    const active = useMyOrders({ status: ACTIVE_ORDER_STATUSES, pageNumber: 1, pageSize: 1 })
    const activeCount = active.data?.totalElements ?? 0
    const items = query.data?.items ?? []
    const ownArea = profile.data?.areaProvince

    return (
        <ShipperShell title={t('shipper.available.title')}>
            {activeCount > 0 && (
                <Link
                    to="/shipper/orders"
                    className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-100"
                >
                    <span className="flex items-center gap-2">
                        <Truck className="size-5 shrink-0" aria-hidden />
                        {t('shipper.available.activeBanner', { count: activeCount })}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-semibold">
                        {t('shipper.available.activeBannerAction')}
                        <ChevronRight className="size-4" aria-hidden />
                    </span>
                </Link>
            )}
            <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs text-gray-600">{t('shipper.available.province')}</span>
                    <Select
                        value={province}
                        onChange={event => {
                            setProvince(event.target.value)
                            setPage(1)
                        }}
                    >
                        <option value="">
                            {ownArea
                                ? t('shipper.available.ownArea', { province: ownArea })
                                : t('shipper.available.ownAreaShort')}
                        </option>
                        {PROVINCES.filter(item => item !== ownArea).map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className="w-36 shrink-0 space-y-1">
                    <span className="text-xs text-gray-600">{t('shipper.available.type')}</span>
                    <Select
                        value={type}
                        onChange={event => {
                            setType(event.target.value as AvailableJobType)
                            setPage(1)
                        }}
                    >
                        {AVAILABLE_JOB_TYPES.map(item => (
                            <option key={item} value={item}>
                                {t(`shipper.available.types.${item}`)}
                            </option>
                        ))}
                    </Select>
                </label>
                <Button
                    variant="outline"
                    icon={<RefreshCw className={query.isFetching ? 'animate-spin' : undefined} />}
                    onClick={() => void query.refetch()}
                    aria-label={t('shipper.common.refresh')}
                />
            </div>

            {query.isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <Skeleton key={i} className="h-36 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState title={t('shipper.available.empty')} description={t('shipper.available.emptyHint')} />
                </div>
            )}

            {items.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    action={
                        <Button
                            block
                            icon={<HandHelping />}
                            loading={accept.pendingId === order.id}
                            disabled={accept.isPending}
                            onClick={() => accept.run(order)}
                        >
                            {t('shipper.available.accept')}
                        </Button>
                    }
                />
            ))}

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
        </ShipperShell>
    )
}
