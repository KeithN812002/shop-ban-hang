import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { SmartImage } from '@/components/ui/smart-image'
import { TabBar } from '@/components/ui/tab-bar'
import { useDebounce } from '@/hooks/use-debounce'
import { formatNumber, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { CategorySelect } from '../components/category-select'
import { useConfirm } from '../components/confirm-dialog'
import { ProductStatusPill } from '../components/product-status'
import { SellerShell } from '../components/seller-shell'
import { PAGE_SIZE, PRODUCT_STATUS_TABS } from '../constants'
import { useDeleteProducts, useSellerProducts } from '../queries'
import type { SellerProductStatus } from '../types'

type StatusTab = SellerProductStatus | 'ALL'

export function ProductsPage() {
    const { t } = useTranslation()
    const { ask, dialog } = useConfirm()
    const [tab, setTab] = useState<StatusTab>('ALL')
    const [keywordInput, setKeywordInput] = useState('')
    const keyword = useDebounce(keywordInput.trim(), 350)
    const [categoryId, setCategoryId] = useState<Uuid | ''>('')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<Set<Uuid>>(new Set())

    const query = useSellerProducts({
        status: tab === 'ALL' ? undefined : tab,
        keyword: keyword || undefined,
        categoryId: categoryId || undefined,
        pageNumber: page,
        pageSize: PAGE_SIZE,
    })
    const remove = useDeleteProducts()

    const items = useMemo(() => query.data?.items ?? [], [query.data])

    // A new filter or page invalidates the current selection.
    useEffect(() => setSelected(new Set()), [tab, keyword, categoryId, page])

    const allSelected = items.length > 0 && items.every(item => selected.has(item.id))
    const toggle = (id: Uuid) =>
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map(item => item.id)))

    const handleBulkDelete = async () => {
        const ids = [...selected]
        if (ids.length === 0) return
        const result = await ask({
            title: t('seller.products.deleteTitle'),
            message: t('seller.products.deleteMessage', { count: ids.length }),
            confirmLabel: t('seller.common.delete'),
            destructive: true,
        })
        if (!result) return
        // Failures are toasted by the shared mutation cache; only the success path is handled here.
        remove.mutate(ids, {
            onSuccess: () => {
                notify.success(t('seller.products.deleted', { count: ids.length }))
                setSelected(new Set())
            },
        })
    }

    const hasFilter = tab !== 'ALL' || keyword !== '' || categoryId !== ''

    return (
        <SellerShell
            title={t('seller.products.title')}
            actions={
                <Link to="/seller/products/new" className={buttonClass()}>
                    <Plus aria-hidden />
                    {t('seller.products.add')}
                </Link>
            }
        >
            <div className="rounded-xl border bg-white">
                <TabBar<StatusTab>
                    ariaLabel={t('seller.products.statusTabs')}
                    value={tab}
                    onChange={value => {
                        setTab(value)
                        setPage(1)
                    }}
                    tabs={PRODUCT_STATUS_TABS.map(value => ({
                        value,
                        label: value === 'ALL' ? t('seller.common.all') : t(`seller.products.status.${value}`),
                    }))}
                />
                <div className="flex flex-wrap items-center gap-2 p-3">
                    <div className="relative min-w-52 flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
                        <Input
                            className="pl-9"
                            value={keywordInput}
                            placeholder={t('seller.products.searchPlaceholder')}
                            aria-label={t('seller.products.searchPlaceholder')}
                            onChange={event => {
                                setKeywordInput(event.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <CategorySelect
                        className="w-full sm:w-64"
                        value={categoryId}
                        emptyLabel={t('seller.products.allCategories')}
                        onChange={value => {
                            setCategoryId(value)
                            setPage(1)
                        }}
                    />
                    <Button
                        variant="danger"
                        icon={<Trash2 />}
                        disabled={selected.size === 0}
                        loading={remove.isPending}
                        onClick={() => void handleBulkDelete()}
                    >
                        {t('seller.products.deleteSelected', { count: selected.size })}
                    </Button>
                </div>
            </div>

            {query.isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}

            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState
                        kind={hasFilter ? 'no-match' : 'empty'}
                        title={t(hasFilter ? 'seller.products.noMatch' : 'seller.products.empty')}
                        action={
                            !hasFilter && (
                                <Link to="/seller/products/new" className={buttonClass()}>
                                    {t('seller.products.add')}
                                </Link>
                            )
                        }
                    />
                </div>
            )}

            {items.length > 0 && (
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="w-10 px-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        aria-label={t('seller.common.selectAll')}
                                    />
                                </th>
                                <th className="px-3 py-2">{t('seller.products.col.product')}</th>
                                <th className="px-3 py-2 text-right">{t('seller.products.col.price')}</th>
                                <th className="px-3 py-2 text-right">{t('seller.products.col.stock')}</th>
                                <th className="px-3 py-2 text-right">{t('seller.products.col.sold')}</th>
                                <th className="px-3 py-2">{t('seller.products.col.status')}</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map(item => (
                                <tr key={item.id} className="align-middle hover:bg-gray-50/60">
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(item.id)}
                                            onChange={() => toggle(item.id)}
                                            aria-label={item.name}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <SmartImage
                                                src={item.thumbnailUrl}
                                                alt={item.name}
                                                className="size-12 shrink-0 rounded-md border object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 font-medium text-gray-800">{item.name}</p>
                                                {item.categoryName && (
                                                    <p className="truncate text-xs text-gray-500">{item.categoryName}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap">{formatPrice(item.price)}</td>
                                    <td className="px-3 py-2 text-right">
                                        <span className={item.stock <= 0 ? 'font-semibold text-red-600' : undefined}>
                                            {formatNumber(item.stock)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatNumber(item.soldCount ?? 0)}</td>
                                    <td className="px-3 py-2">
                                        <ProductStatusPill status={item.status} />
                                        {item.status === 'BANNED' && item.banReason && (
                                            <p className="mt-1 max-w-48 text-xs text-red-600">
                                                {t('seller.products.banReason', { reason: item.banReason })}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Link
                                            to="/seller/products/$id"
                                            params={{ id: item.id }}
                                            className={buttonClass({ variant: 'outline', size: 'sm' })}
                                        >
                                            {t('seller.common.edit')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
            {dialog}
        </SellerShell>
    )
}
