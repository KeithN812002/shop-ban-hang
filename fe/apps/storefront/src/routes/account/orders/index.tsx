import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { SmartImage } from '@/components/ui/smart-image'
import { TabBar } from '@/components/ui/tab-bar'
import { isOrderTabKey, ORDER_TABS, statusParamForTab, type OrderTabKey } from '@/features/orders/constants'
import { useOrders } from '@/features/orders/queries'
import { formatDateTime, formatPrice } from '@/lib/format'

interface OrdersSearch {
    tab?: OrderTabKey
    page?: number
}

export const Route = createFileRoute('/account/orders/')({
    validateSearch: (raw: Record<string, unknown>): OrdersSearch => {
        const page = Number(raw.page)
        return {
            tab: isOrderTabKey(raw.tab) && raw.tab !== 'all' ? raw.tab : undefined,
            page: Number.isFinite(page) && page > 1 ? Math.floor(page) : undefined,
        }
    },
    component: OrdersPage,
})

function OrdersPage() {
    const { t, i18n } = useTranslation()
    const { tab = 'all', page = 1 } = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })
    const orders = useOrders({ status: statusParamForTab(tab), pageNumber: page, pageSize: 10 })

    return (
        <div className="space-y-3">
            <h1 className="sr-only">{t('order.title')}</h1>
            <TabBar
                ariaLabel={t('order.title')}
                value={tab}
                onChange={next => void navigate({ search: { tab: next === 'all' ? undefined : next } })}
                tabs={ORDER_TABS.map(item => ({ value: item.key, label: t(`order.tabs.${item.key}`) }))}
                className="rounded-xl"
            />

            {orders.isLoading && (
                <>
                    <Skeleton className="h-36 w-full rounded-xl" />
                    <Skeleton className="h-36 w-full rounded-xl" />
                </>
            )}
            {orders.isError && <ErrorState onRetry={() => void orders.refetch()} />}
            {orders.data?.items.length === 0 && (
                <div className="rounded-xl bg-white">
                    <EmptyState title={t('order.empty')} />
                </div>
            )}

            {orders.data?.items.map(order => (
                <article key={order.id} className="overflow-hidden rounded-xl bg-white">
                    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Store className="size-4 text-gray-500" aria-hidden />
                            {order.store.name}
                            <span className="font-normal text-gray-400">#{order.code}</span>
                        </p>
                        <OrderStatusBadge status={order.status} />
                    </header>
                    <Link to="/account/orders/$id" params={{ id: order.id }} className="flex gap-3 px-4 py-3 hover:bg-gray-50">
                        <SmartImage
                            src={order.firstItem.imageUrl}
                            alt={order.firstItem.name}
                            className="size-20 shrink-0 rounded-md border object-cover"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm text-gray-900">{order.firstItem.name}</p>
                            {order.firstItem.variantName && (
                                <p className="text-xs text-gray-500">{order.firstItem.variantName}</p>
                            )}
                            <p className="text-xs text-gray-500">x{order.firstItem.quantity}</p>
                            {order.itemCount > 1 && (
                                <p className="mt-1 text-xs text-gray-400">
                                    {t('order.moreItems', { count: order.itemCount - 1 })}
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-gray-700">{formatPrice(order.firstItem.price)}</p>
                    </Link>
                    <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50/60 px-4 py-3">
                        <p className="text-xs text-gray-500">{formatDateTime(order.createdDate, i18n.language)}</p>
                        <div className="flex items-center gap-3">
                            <p className="text-sm">
                                {t('order.total')}: <span className="text-lg font-bold text-brand-600">{formatPrice(order.total)}</span>
                            </p>
                            <Link
                                to="/account/orders/$id"
                                params={{ id: order.id }}
                                className={buttonClass({ variant: 'outline', size: 'sm' })}
                            >
                                {t('order.viewDetail')}
                            </Link>
                        </div>
                    </footer>
                </article>
            ))}

            {orders.data && (
                <Pagination
                    page={page}
                    totalPages={orders.data.totalPages}
                    onChange={next => void navigate({ search: prev => ({ ...prev, page: next > 1 ? next : undefined }) })}
                />
            )}
        </div>
    )
}
