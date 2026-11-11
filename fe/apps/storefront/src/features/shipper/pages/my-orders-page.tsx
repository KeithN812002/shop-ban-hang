import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PackageCheck, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { TabBar } from '@/components/ui/tab-bar'
import { notify } from '@/lib/notify'
import { OrderCard } from '../components/order-card'
import { ShipperShell } from '../components/shipper-shell'
import { useMyOrders, usePickedUp } from '../queries'
import { MY_ORDER_STATUSES as TABS, type MyOrderStatus } from '../types'

const PAGE_SIZE = 10

interface MyOrdersPageProps {
    status: MyOrderStatus
    onStatusChange: (status: MyOrderStatus) => void
}

export function MyOrdersPage({ status, onStatusChange }: MyOrdersPageProps) {
    const { t } = useTranslation()
    const [page, setPage] = useState(1)
    const query = useMyOrders({ status, pageNumber: page, pageSize: PAGE_SIZE })
    const pickedUp = usePickedUp()
    const items = query.data?.items ?? []

    return (
        <ShipperShell title={t('shipper.orders.title')}>
            <div className="overflow-hidden rounded-xl border bg-white">
                <TabBar<MyOrderStatus>
                    ariaLabel={t('shipper.orders.tabs')}
                    value={status}
                    onChange={value => {
                        setPage(1)
                        onStatusChange(value)
                    }}
                    tabs={TABS.map(value => ({ value, label: t(`shipper.orders.tab.${value}`) }))}
                />
            </div>

            {query.isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState title={t(`shipper.orders.empty.${status}`)} />
                </div>
            )}
            {items.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    action={
                        order.status === 'PICKING' ? (
                            <Button
                                block
                                icon={<PackageCheck />}
                                loading={pickedUp.isPending && pickedUp.variables === order.id}
                                disabled={pickedUp.isPending}
                                onClick={() =>
                                    pickedUp.mutate(order.id, {
                                        onSuccess: () => notify.success(t('shipper.detail.pickedUpDone')),
                                    })
                                }
                            >
                                {t('shipper.detail.pickedUp')}
                            </Button>
                        ) : order.status === 'SHIPPING' ? (
                            <Link
                                to="/shipper/orders/$id"
                                params={{ id: order.id }}
                                className={buttonClass({ block: true })}
                            >
                                <Truck aria-hidden />
                                {t('shipper.card.deliver')}
                            </Link>
                        ) : undefined
                    }
                />
            ))}

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
        </ShipperShell>
    )
}
