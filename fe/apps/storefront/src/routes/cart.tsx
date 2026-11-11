import { createFileRoute, Link } from '@tanstack/react-router'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { RequireAuth } from '@/components/auth/require-auth'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { QuantityInput } from '@/components/ui/quantity-input'
import { SmartImage } from '@/components/ui/smart-image'
import {
    useCart,
    useDeleteCartItems,
    useSetCartSelection,
    useUpdateCartItem,
} from '@/features/cart/queries'
import { formatPrice } from '@/lib/format'
import type { CartItem } from '@/types/shop'

export const Route = createFileRoute('/cart')({
    component: () => (
        <RequireAuth>
            <CartPage />
        </RequireAuth>
    ),
})

const selectable = (item: CartItem) => item.available && item.stock > 0

function CartPage() {
    const { t } = useTranslation()
    const cart = useCart()
    const update = useUpdateCartItem()
    const setSelection = useSetCartSelection()
    const remove = useDeleteCartItems()

    const groups = cart.data?.groups ?? []
    const allItems = groups.flatMap(group => group.items)
    const selectableItems = allItems.filter(selectable)
    const selectedItems = allItems.filter(item => item.selected && selectable(item))
    const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const allSelected = selectableItems.length > 0 && selectableItems.every(item => item.selected)

    const toggleMany = (items: CartItem[], selected: boolean) =>
        setSelection.mutate({ ids: items.filter(selectable).map(item => item.id), selected })

    return (
        <div className="container-page py-4">
            <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <ShoppingCart className="size-6 text-brand-500" aria-hidden />
                {t('cart.title')}
            </h1>

            {cart.isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            )}
            {cart.isError && <ErrorState onRetry={() => void cart.refetch()} />}

            {cart.data && allItems.length === 0 && (
                <div className="rounded-xl bg-white">
                    <EmptyState
                        title={t('cart.empty')}
                        description={t('cart.emptyHint')}
                        action={
                            <Link to="/" className={buttonClass()}>
                                {t('cart.continueShopping')}
                            </Link>
                        }
                    />
                </div>
            )}

            {allItems.length > 0 && (
                <div className="space-y-3 pb-28">
                    {groups.map(group => (
                        <section key={group.store.id} aria-label={group.store.name} className="overflow-hidden rounded-xl bg-white">
                            <header className="flex items-center gap-3 border-b px-4 py-3">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-brand-500"
                                    aria-label={t('cart.selectStore', { name: group.store.name })}
                                    checked={group.items.filter(selectable).length > 0 && group.items.filter(selectable).every(i => i.selected)}
                                    onChange={event => toggleMany(group.items, event.target.checked)}
                                />
                                <Link
                                    to="/store/$id"
                                    params={{ id: group.store.id }}
                                    className="font-semibold text-gray-900 hover:text-brand-600"
                                >
                                    {group.store.name}
                                </Link>
                            </header>
                            <ul className="divide-y">
                                {group.items.map(item => (
                                    <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                                        <input
                                            type="checkbox"
                                            className="size-4 shrink-0 accent-brand-500"
                                            aria-label={t('cart.selectItem', { name: item.name })}
                                            disabled={!selectable(item)}
                                            checked={item.selected && selectable(item)}
                                            onChange={event => update.mutate({ id: item.id, selected: event.target.checked })}
                                        />
                                        <Link
                                            to="/product/$id"
                                            params={{ id: item.productId }}
                                            className="size-20 shrink-0 overflow-hidden rounded-md border"
                                        >
                                            <SmartImage src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                                        </Link>
                                        <div className="min-w-0 flex-1 basis-40">
                                            <Link
                                                to="/product/$id"
                                                params={{ id: item.productId }}
                                                className="line-clamp-2 text-sm text-gray-900 hover:text-brand-600"
                                            >
                                                {item.name}
                                            </Link>
                                            {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                                            {!selectable(item) && (
                                                <p className="text-xs font-medium text-red-600">
                                                    {item.available ? t('product.outOfStock') : t('cart.unavailable')}
                                                </p>
                                            )}
                                        </div>
                                        <p className="w-28 text-sm font-medium text-gray-800 sm:text-right">
                                            {formatPrice(item.price)}
                                        </p>
                                        <QuantityInput
                                            value={item.quantity}
                                            max={Math.max(item.stock, 1)}
                                            disabled={!selectable(item)}
                                            onChange={quantity => update.mutate({ id: item.id, quantity })}
                                        />
                                        <p className="w-28 text-sm font-semibold text-brand-600 sm:text-right">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => remove.mutate([item.id])}
                                            aria-label={t('cart.remove')}
                                            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}

                    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white shadow-[0_-4px_12px_rgb(0_0_0/0.06)]">
                        <div className="container-page flex flex-wrap items-center gap-3 py-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-brand-500"
                                    checked={allSelected}
                                    onChange={event => toggleMany(allItems, event.target.checked)}
                                />
                                {t('cart.selectAll', { count: allItems.length })}
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={selectedItems.length === 0}
                                loading={remove.isPending}
                                onClick={() => remove.mutate(selectedItems.map(item => item.id))}
                            >
                                {t('cart.removeSelected')}
                            </Button>
                            <div className="ml-auto flex items-center gap-4">
                                <p className="text-sm text-gray-600">
                                    {t('cart.total', { count: selectedItems.length })}:{' '}
                                    <span className="text-xl font-bold text-brand-600">{formatPrice(total)}</span>
                                </p>
                                {selectedItems.length > 0 ? (
                                    <Link to="/checkout" className={buttonClass({ size: 'lg' })}>
                                        {t('cart.checkout')}
                                    </Link>
                                ) : (
                                    <Button size="lg" disabled>
                                        {t('cart.checkout')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
