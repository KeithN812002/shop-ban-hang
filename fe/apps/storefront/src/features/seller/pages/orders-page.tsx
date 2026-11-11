import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, Undo2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { SmartImage } from '@/components/ui/smart-image'
import { TabBar } from '@/components/ui/tab-bar'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDateTime, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { useConfirm } from '../components/confirm-dialog'
import { OrderStatusPill } from '../components/order-status'
import { SellerShell } from '../components/seller-shell'
import { ORDER_TABS, PAGE_SIZE, statusParamOf, type OrderFilter } from '../constants'
import type { OrdersSearch } from '../lib/orders-search'
import { useConfirmReturned, useSellerOrders } from '../queries'

type Tab = OrderFilter | 'ALL'

interface OrdersPageProps {
    search: OrdersSearch
    onSearchChange: (next: OrdersSearch) => void
}

export function OrdersPage({ search, onSearchChange }: OrdersPageProps) {
    const { t } = useTranslation()
    const [keywordInput, setKeywordInput] = useState(search.keyword ?? '')
    const keyword = useDebounce(keywordInput.trim(), 350)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [page, setPage] = useState(1)

    // Push the debounced keyword into the URL so the list is shareable / survives reload.
    useEffect(() => {
        if ((search.keyword ?? '') !== keyword) onSearchChange({ ...search, keyword: keyword || undefined })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced keyword
    }, [keyword])

    const query = useSellerOrders({
        status: statusParamOf(search.status),
        keyword: search.keyword,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
    })
    const items = query.data?.items ?? []
    const hasFilter = Boolean(search.status || search.keyword || fromDate || toDate)
    const confirmReturned = useConfirmReturned()
    const { ask, dialog } = useConfirm()

    const handleConfirmReturned = async (id: Uuid) => {
        const result = await ask({
            title: t('seller.orders.confirmReturnedTitle'),
            message: t('seller.orders.confirmReturnedMessage'),
            confirmLabel: t('seller.orders.confirmReturned'),
        })
        if (!result) return
        confirmReturned.mutate({ id }, { onSuccess: () => notify.success(t('seller.orders.returnedConfirmed')) })
    }

    return (
        <SellerShell title={t('seller.orders.title')}>
            <div className="rounded-xl border bg-white">
                <TabBar<Tab>
                    ariaLabel={t('seller.orders.statusTabs')}
                    value={search.status ?? 'ALL'}
                    onChange={value => {
                        setPage(1)
                        onSearchChange({ ...search, status: value === 'ALL' ? undefined : value })
                    }}
                    tabs={ORDER_TABS.map(value => ({
                        value,
                        label:
                            value === 'ALL'
                                ? t('seller.common.all')
                                : value === 'RETURNS'
                                  ? t('seller.orders.returnsTab')
                                  : t(`seller.orderStatus.${value}`),
                    }))}
                />
                <div className="flex flex-wrap items-end gap-2 p-3">
                    <div className="relative min-w-52 flex-1">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <Input
                            className="pl-9"
                            value={keywordInput}
                            placeholder={t('seller.orders.searchPlaceholder')}
                            aria-label={t('seller.orders.searchPlaceholder')}
                            onChange={event => {
                                setKeywordInput(event.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <label className="space-y-1 text-xs text-gray-600">
                        <span>{t('seller.common.fromDate')}</span>
                        <Input
                            type="date"
                            className="w-40"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={event => {
                                setFromDate(event.target.value)
                                setPage(1)
                            }}
                        />
                    </label>
                    <label className="space-y-1 text-xs text-gray-600">
                        <span>{t('seller.common.toDate')}</span>
                        <Input
                            type="date"
                            className="w-40"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={event => {
                                setToDate(event.target.value)
                                setPage(1)
                            }}
                        />
                    </label>
                    {hasFilter && (
                        <Button
                            variant="ghost"
                            icon={<X />}
                            onClick={() => {
                                setKeywordInput('')
                                setFromDate('')
                                setToDate('')
                                setPage(1)
                                onSearchChange({})
                            }}
                        >
                            {t('seller.common.clearFilters')}
                        </Button>
                    )}
                </div>
            </div>

            {query.isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState
                        kind={hasFilter ? 'no-match' : 'empty'}
                        title={t(hasFilter ? 'seller.orders.noMatch' : 'seller.orders.empty')}
                    />
                </div>
            )}

            <ul className="space-y-2">
                {items.map(order => (
                    <li key={order.id} className="rounded-xl border bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-semibold text-gray-900">#{order.code}</span>
                                <span className="text-gray-500">{formatDateTime(order.createdDate)}</span>
                                {(order.receiverName ?? order.buyerName) && (
                                    <span className="text-gray-600">{order.receiverName ?? order.buyerName}</span>
                                )}
                            </div>
                            <OrderStatusPill status={order.status} />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <SmartImage
                                src={order.firstItem?.imageUrl}
                                alt={order.firstItem?.name ?? order.code}
                                className="size-16 shrink-0 rounded-md border object-cover"
                            />
                            <div className="min-w-0 flex-1 text-sm">
                                <p className="line-clamp-2 text-gray-800">{order.firstItem?.name}</p>
                                {order.firstItem?.variantName && (
                                    <p className="text-xs text-gray-500">{order.firstItem.variantName}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                    {t('seller.orders.itemCount', { count: order.itemCount })}
                                </p>
                            </div>
                            <div className="shrink-0 space-y-2 text-right">
                                <p className="text-sm font-semibold text-brand-600">{formatPrice(order.total)}</p>
                                <Link
                                    to="/seller/orders/$id"
                                    params={{ id: order.id }}
                                    className={buttonClass({ variant: 'outline', size: 'sm' })}
                                >
                                    {t('seller.orders.view')}
                                </Link>
                                {order.status === 'RETURNING' && (
                                    <Button
                                        size="sm"
                                        icon={<Undo2 />}
                                        loading={
                                            confirmReturned.isPending && confirmReturned.variables?.id === order.id
                                        }
                                        disabled={confirmReturned.isPending}
                                        onClick={() => void handleConfirmReturned(order.id)}
                                    >
                                        {t('seller.orders.confirmReturned')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
            {dialog}
        </SellerShell>
    )
}
