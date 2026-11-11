import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { MapPin, Plus, Ticket, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { RequireAuth } from '@/components/auth/require-auth'
import { Button, buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'
import { Select, Textarea } from '@/components/ui/form-controls'
import { SmartImage } from '@/components/ui/smart-image'
import { AddressFormModal, formatAddress } from '@/features/account/components/address-form-modal'
import { useAddresses } from '@/features/account/queries'
import { useCreateOrder, useOrderPreview, useVouchers } from '@/features/orders/queries'
import { formatPrice } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'
import type { OrderRequestBase, VoucherResponse } from '@/types/shop'

export const Route = createFileRoute('/checkout/')({
    component: () => (
        <RequireAuth>
            <CheckoutPage />
        </RequireAuth>
    ),
})

const describeVoucher = (v: VoucherResponse, t: (key: string, opts?: Record<string, unknown>) => string): string =>
    `${v.code} - ${v.name} (${
        v.discountType === 'PERCENT' ? `-${v.discountValue}%` : `-${formatPrice(v.discountValue)}`
    }${v.minOrderValue ? `, ${t('checkout.minOrder', { value: formatPrice(v.minOrderValue) })}` : ''})`

function StoreVoucherSelect({
    storeId,
    value,
    onChange,
}: {
    storeId: string
    value: string
    onChange: (code: string) => void
}) {
    const { t } = useTranslation()
    const vouchers = useVouchers(storeId)
    // The endpoint returns platform + store vouchers: keep only this store's.
    const options = (vouchers.data ?? []).filter(v => v.storeId === storeId)
    return (
        <Select value={value} onChange={event => onChange(event.target.value)} aria-label={t('checkout.storeVoucher')}>
            <option value="">{options.length > 0 ? t('checkout.noVoucher') : t('checkout.noVoucherAvailable')}</option>
            {options.map(v => (
                <option key={v.id} value={v.code}>
                    {describeVoucher(v, t)}
                </option>
            ))}
        </Select>
    )
}

function CheckoutPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const addresses = useAddresses()
    const platformVouchers = useVouchers(undefined)
    const createOrder = useCreateOrder()

    const [addressId, setAddressId] = useState<string>('')
    const [storeVouchers, setStoreVouchers] = useState<Record<string, string>>({})
    const [platformCode, setPlatformCode] = useState('')
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [addressModal, setAddressModal] = useState(false)
    const knownAddressIds = useRef<Set<string> | null>(null)

    // Default selection + auto-select a freshly created address.
    useEffect(() => {
        const list = addresses.data
        if (!list) return
        const ids = new Set(list.map(a => a.id))
        const previous = knownAddressIds.current
        knownAddressIds.current = ids
        const added = previous ? list.find(a => !previous.has(a.id)) : undefined
        if (added) setAddressId(added.id)
        else if (!addressId || !ids.has(addressId)) setAddressId((list.find(a => a.isDefault) ?? list[0])?.id ?? '')
    }, [addresses.data, addressId])

    const request = useMemo<OrderRequestBase | null>(() => {
        if (!addressId) return null
        const vouchers = Object.fromEntries(Object.entries(storeVouchers).filter(([, code]) => code))
        return { addressId, storeVouchers: vouchers, platformVoucherCode: platformCode || undefined }
    }, [addressId, storeVouchers, platformCode])

    const preview = useOrderPreview(request)
    const data = preview.data
    const platformOptions = (platformVouchers.data ?? []).filter(v => v.storeId === null)

    const subtotal = data?.orders.reduce((sum, o) => sum + o.subtotal, 0) ?? 0
    const shipping = data?.orders.reduce((sum, o) => sum + o.shippingFee, 0) ?? 0
    const storeDiscount = data?.orders.reduce((sum, o) => sum + o.storeDiscount, 0) ?? 0

    const place = () => {
        if (!request) return
        createOrder.mutate(
            { ...request, note: Object.fromEntries(Object.entries(notes).filter(([, v]) => v.trim())) },
            {
                onSuccess: result => void navigate({ to: '/checkout/success', search: { codes: result.codes.join(',') } }),
            },
        )
    }

    const noItems = data && data.orders.length === 0

    return (
        <div className="container-page space-y-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">{t('checkout.title')}</h1>

            <section className="rounded-xl bg-white p-4" aria-label={t('checkout.address')}>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-semibold text-brand-600">
                        <MapPin className="size-5" aria-hidden />
                        {t('checkout.address')}
                    </h2>
                    <Button variant="outline" size="sm" icon={<Plus />} onClick={() => setAddressModal(true)}>
                        {t('address.add')}
                    </Button>
                </div>
                {addresses.isLoading && <Skeleton className="h-16 w-full" />}
                {addresses.data?.length === 0 && <p className="text-sm text-gray-500">{t('checkout.noAddress')}</p>}
                <div role="radiogroup" aria-label={t('checkout.address')} className="space-y-2">
                    {addresses.data?.map(address => (
                        <label
                            key={address.id}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                                address.id === addressId ? 'border-brand-500 bg-brand-50/50' : 'hover:border-brand-300',
                            )}
                        >
                            <input
                                type="radio"
                                name="address"
                                className="mt-1 accent-brand-500"
                                checked={address.id === addressId}
                                onChange={() => setAddressId(address.id)}
                            />
                            <span className="text-sm">
                                <span className="font-semibold">{address.receiverName}</span>
                                <span className="text-gray-500"> | {address.phone}</span>
                                {address.isDefault && (
                                    <span className="ml-2 rounded border border-brand-300 px-1.5 py-0.5 text-xs text-brand-600">
                                        {t('address.default')}
                                    </span>
                                )}
                                <span className="block text-gray-700">{formatAddress(address)}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </section>

            {preview.isLoading && <Skeleton className="h-48 w-full rounded-xl" />}
            {preview.isError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {getErrorMessage(preview.error, t('checkout.previewFailed'))}
                </div>
            )}
            {noItems && (
                <div className="rounded-xl bg-white">
                    <EmptyState
                        title={t('checkout.noItems')}
                        action={
                            <Link to="/cart" className={buttonClass()}>
                                {t('checkout.backToCart')}
                            </Link>
                        }
                    />
                </div>
            )}

            {data?.orders.map(order => (
                <section key={order.storeId} aria-label={order.storeName} className="overflow-hidden rounded-xl bg-white">
                    <header className="border-b px-4 py-3 font-semibold">{order.storeName}</header>
                    <ul className="divide-y">
                        {order.items.map((item, index) => (
                            <li key={`${item.productId ?? index}-${item.variantId ?? ''}`} className="flex items-center gap-3 px-4 py-3">
                                <SmartImage src={item.imageUrl} alt={item.name} className="size-16 shrink-0 rounded-md border object-cover" />
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm">{item.name}</p>
                                    {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                                </div>
                                <p className="text-sm text-gray-600">
                                    {formatPrice(item.price)} x {item.quantity}
                                </p>
                                <p className="w-28 text-right text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="grid gap-3 border-t bg-gray-50/60 px-4 py-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <p className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                <Ticket className="size-4 text-brand-500" aria-hidden />
                                {t('checkout.storeVoucher')}
                            </p>
                            <StoreVoucherSelect
                                storeId={order.storeId}
                                value={storeVouchers[order.storeId] ?? ''}
                                onChange={code => setStoreVouchers(prev => ({ ...prev, [order.storeId]: code }))}
                            />
                        </div>
                        <label className="space-y-1">
                            <span className="text-sm font-medium text-gray-700">{t('checkout.note')}</span>
                            <Textarea
                                rows={2}
                                maxLength={300}
                                value={notes[order.storeId] ?? ''}
                                onChange={event => setNotes(prev => ({ ...prev, [order.storeId]: event.target.value }))}
                                placeholder={t('checkout.notePlaceholder')}
                            />
                        </label>
                    </div>
                    <dl className="space-y-1 border-t px-4 py-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600">{t('checkout.subtotal')}</dt>
                            <dd>{formatPrice(order.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600">{t('checkout.shippingFee')}</dt>
                            <dd>{order.shippingFee === 0 ? t('checkout.freeShip') : formatPrice(order.shippingFee)}</dd>
                        </div>
                        {order.storeDiscount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <dt>{t('checkout.storeDiscount')}</dt>
                                <dd>-{formatPrice(order.storeDiscount)}</dd>
                            </div>
                        )}
                    </dl>
                </section>
            ))}

            {data && data.orders.length > 0 && (
                <>
                    <section className="space-y-3 rounded-xl bg-white p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                    <Ticket className="size-4 text-brand-500" aria-hidden />
                                    {t('checkout.platformVoucher')}
                                </p>
                                <Select
                                    value={platformCode}
                                    onChange={event => setPlatformCode(event.target.value)}
                                    aria-label={t('checkout.platformVoucher')}
                                >
                                    <option value="">
                                        {platformOptions.length > 0 ? t('checkout.noVoucher') : t('checkout.noVoucherAvailable')}
                                    </option>
                                    {platformOptions.map(v => (
                                        <option key={v.id} value={v.code}>
                                            {describeVoucher(v, t)}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <p className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                    <Wallet className="size-4 text-brand-500" aria-hidden />
                                    {t('checkout.payment')}
                                </p>
                                <p className="mt-2 rounded-md border border-brand-300 bg-brand-50 px-3 py-2 text-sm text-brand-700">
                                    {t('checkout.cod')}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl bg-white p-4" aria-label={t('checkout.summary')}>
                        <dl className="ml-auto max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-600">{t('checkout.subtotal')}</dt>
                                <dd>{formatPrice(subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-600">{t('checkout.shippingFee')}</dt>
                                <dd>{formatPrice(shipping)}</dd>
                            </div>
                            {storeDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <dt>{t('checkout.storeDiscount')}</dt>
                                    <dd>-{formatPrice(storeDiscount)}</dd>
                                </div>
                            )}
                            {data.platformDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <dt>{t('checkout.platformDiscount')}</dt>
                                    <dd>-{formatPrice(data.platformDiscount)}</dd>
                                </div>
                            )}
                            <div className="flex items-baseline justify-between border-t pt-3">
                                <dt className="font-semibold">{t('checkout.total')}</dt>
                                <dd className="text-2xl font-bold text-brand-600">{formatPrice(data.total)}</dd>
                            </div>
                        </dl>
                        <div className="mt-4 flex justify-end">
                            <Button
                                size="lg"
                                loading={createOrder.isPending}
                                disabled={!request || preview.isFetching || preview.isError}
                                onClick={place}
                            >
                                {t('checkout.placeOrder')}
                            </Button>
                        </div>
                    </section>
                </>
            )}

            <AddressFormModal open={addressModal} onClose={() => setAddressModal(false)} />
        </div>
    )
}
