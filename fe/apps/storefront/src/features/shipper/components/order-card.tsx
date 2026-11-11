import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Banknote, MapPin, Store, Truck, User, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { OrderStatusPill } from '@/features/seller/components/order-status'
import { formatPrice } from '@/lib/format'
import { codAmountOf, isReturnJob, pickupAddressOf } from '../lib/order-utils'
import { MAX_DELIVERY_ATTEMPTS, type ShipperOrderRow } from '../types'

interface OrderCardProps {
    order: ShipperOrderRow
    /** Primary action: accept on the available list, next delivery step on "my orders". */
    action?: ReactNode
}

/** List card: pickup address, receiver area, COD to collect and shipping fee (return jobs: buyer pickup, shop drop-off). */
export function OrderCard({ order, action }: OrderCardProps) {
    const { t } = useTranslation()
    const storeAddress = pickupAddressOf(order)
    const returnJob = isReturnJob(order)
    const cod = codAmountOf(order)
    const attempts = order.failedAttempts ?? 0

    return (
        <article className="space-y-3 rounded-xl border bg-white p-3">
            <Link
                to="/shipper/orders/$id"
                params={{ id: order.id }}
                className="block space-y-2"
                aria-label={t('shipper.card.open', { code: order.code })}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold text-gray-900">
                        #{order.code}
                        {returnJob && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                <Undo2 className="size-3" aria-hidden />
                                {t('shipper.card.returnBadge')}
                            </span>
                        )}
                    </span>
                    <OrderStatusPill status={order.status} />
                </div>
                {returnJob ? (
                    <div className="space-y-1.5 text-sm">
                        <p className="flex items-start gap-2 text-gray-700">
                            <User className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                            <span>
                                <span className="block text-xs text-gray-500">
                                    {t('shipper.card.returnPickupFrom')}
                                </span>
                                <span className="font-medium">{order.receiverName ?? '—'}</span>
                                <span className="block text-xs text-gray-500">
                                    {order.shippingAddress ?? order.province ?? '—'}
                                </span>
                            </span>
                        </p>
                        <p className="flex items-start gap-2 text-gray-700">
                            <Store className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                            <span>
                                <span className="block text-xs text-gray-500">{t('shipper.card.returnDropoff')}</span>
                                <span className="font-medium">{order.storeName ?? t('shipper.card.store')}</span>
                                {storeAddress && <span className="block text-xs text-gray-500">{storeAddress}</span>}
                            </span>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5 text-sm">
                        <p className="flex items-start gap-2 text-gray-700">
                            <Store className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                            <span>
                                <span className="font-medium">{order.storeName ?? t('shipper.card.store')}</span>
                                {storeAddress && <span className="block text-xs text-gray-500">{storeAddress}</span>}
                            </span>
                        </p>
                        <p className="flex items-start gap-2 text-gray-700">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                            <span>
                                {order.province ?? order.shippingAddress ?? '—'}
                                {order.receiverName && (
                                    <span className="block text-xs text-gray-500">{order.receiverName}</span>
                                )}
                            </span>
                        </p>
                    </div>
                )}
                {!returnJob && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-sm">
                        <span className="flex items-center gap-1.5 font-semibold text-brand-600">
                            <Banknote className="size-4" aria-hidden />
                            {t('shipper.card.cod')}: {formatPrice(cod)}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-600">
                            <Truck className="size-4" aria-hidden />
                            {t('shipper.card.fee')}: {formatPrice(order.shippingFee)}
                        </span>
                        {attempts > 0 && (
                            <span className="text-xs font-medium text-amber-700">
                                {t('shipper.card.attempts', { count: attempts, max: MAX_DELIVERY_ATTEMPTS })}
                            </span>
                        )}
                    </div>
                )}
            </Link>
            {action}
        </article>
    )
}
