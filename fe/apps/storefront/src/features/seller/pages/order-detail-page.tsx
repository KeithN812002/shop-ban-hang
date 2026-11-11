import { Link } from '@tanstack/react-router'
import { ArrowLeft, Check, PackageCheck, Printer, Undo2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button, buttonClass } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { SmartImage } from '@/components/ui/smart-image'
import { formatDateTime, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { isReturnHistoryAction } from '@/features/orders/lib/return-flow'
import { useConfirm } from '../components/confirm-dialog'
import { OrderStatusPill } from '../components/order-status'
import { PackingSlip } from '../components/packing-slip'
import { ReturnPanel } from '../components/return-panel'
import { SellerShell } from '../components/seller-shell'
import { useCancelOrder, useConfirmOrder, useConfirmReturned, useReadyToShip, useSellerOrder } from '../queries'

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className={`flex justify-between gap-4 text-sm ${strong ? 'border-t pt-2 text-base font-bold' : ''}`}>
            <dt className="text-gray-600">{label}</dt>
            <dd className={strong ? 'text-brand-600' : 'text-gray-800'}>{value}</dd>
        </div>
    )
}

export function OrderDetailPage({ orderId }: { orderId: Uuid }) {
    const { t } = useTranslation()
    const query = useSellerOrder(orderId)
    const confirmOrder = useConfirmOrder()
    const readyToShip = useReadyToShip()
    const cancelOrder = useCancelOrder()
    const confirmReturned = useConfirmReturned()
    const { ask, dialog } = useConfirm()
    const order = query.data

    const busy = confirmOrder.isPending || readyToShip.isPending || cancelOrder.isPending || confirmReturned.isPending

    const handleConfirm = () => {
        confirmOrder.mutate({ id: orderId }, { onSuccess: () => notify.success(t('seller.orders.confirmed')) })
    }
    const handleReady = () => {
        readyToShip.mutate({ id: orderId }, { onSuccess: () => notify.success(t('seller.orders.readySet')) })
    }
    const handleCancel = async () => {
        const result = await ask({
            title: t('seller.orders.cancelTitle'),
            message: t('seller.orders.cancelMessage'),
            confirmLabel: t('seller.orders.cancelConfirm'),
            destructive: true,
            reason: { label: t('seller.orders.cancelReason'), required: true },
        })
        if (!result) return
        cancelOrder.mutate(
            { id: orderId, reason: result.reason },
            { onSuccess: () => notify.success(t('seller.orders.cancelled')) },
        )
    }

    const handleConfirmReturned = async () => {
        const result = await ask({
            title: t('seller.orders.confirmReturnedTitle'),
            message: t('seller.orders.confirmReturnedMessage'),
            confirmLabel: t('seller.orders.confirmReturned'),
        })
        if (!result) return
        confirmReturned.mutate(
            { id: orderId },
            { onSuccess: () => notify.success(t('seller.orders.returnedConfirmed')) },
        )
    }

    const history = order ? [...order.history].sort((a, b) => a.createdDate.localeCompare(b.createdDate)) : []

    return (
        <SellerShell
            title={order ? t('seller.orders.detailTitle', { code: order.code }) : t('seller.orders.title')}
            actions={
                <>
                    <Link to="/seller/orders" className={buttonClass({ variant: 'outline' })}>
                        <ArrowLeft aria-hidden />
                        {t('seller.common.back')}
                    </Link>
                    {order && (
                        <Button variant="outline" icon={<Printer />} onClick={() => window.print()}>
                            {t('seller.orders.print')}
                        </Button>
                    )}
                </>
            }
        >
            {query.isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}

            {order && (
                <>
                    <div className="space-y-4 print:hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                    <OrderStatusPill status={order.status} />
                                    <span className="text-gray-500">{formatDateTime(order.createdDate)}</span>
                                </div>
                                {order.status === 'RETURNING' && (
                                    <p className="text-orange-700">{t('seller.orders.returningHint')}</p>
                                )}
                                {order.status === 'CANCELLED' && order.cancelReason && (
                                    <p className="text-red-600">
                                        {t('seller.orders.cancelledReason', { reason: order.cancelReason })}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {order.status === 'PENDING' && (
                                    <Button
                                        icon={<Check />}
                                        loading={confirmOrder.isPending}
                                        disabled={busy}
                                        onClick={handleConfirm}
                                    >
                                        {t('seller.orders.confirm')}
                                    </Button>
                                )}
                                {order.status === 'CONFIRMED' && (
                                    <Button
                                        icon={<PackageCheck />}
                                        loading={readyToShip.isPending}
                                        disabled={busy}
                                        onClick={handleReady}
                                    >
                                        {t('seller.orders.readyToShip')}
                                    </Button>
                                )}
                                {order.status === 'RETURNING' && (
                                    <Button
                                        icon={<Undo2 />}
                                        loading={confirmReturned.isPending}
                                        disabled={busy}
                                        onClick={() => void handleConfirmReturned()}
                                    >
                                        {t('seller.orders.confirmReturned')}
                                    </Button>
                                )}
                                {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                    <Button
                                        variant="danger"
                                        icon={<XCircle />}
                                        loading={cancelOrder.isPending}
                                        disabled={busy}
                                        onClick={() => void handleCancel()}
                                    >
                                        {t('seller.orders.cancel')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <ReturnPanel order={order} />

                        <div className="grid gap-4 lg:grid-cols-3">
                            <section className="space-y-2 rounded-xl border bg-white p-4 lg:col-span-2">
                                <h2 className="text-base font-semibold text-gray-800">{t('seller.orders.items')}</h2>
                                <ul className="divide-y">
                                    {order.items.map(item => (
                                        <li key={item.id} className="flex items-center gap-3 py-2">
                                            <SmartImage
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                className="size-14 shrink-0 rounded-md border object-cover"
                                            />
                                            <div className="min-w-0 flex-1 text-sm">
                                                <p className="line-clamp-2 text-gray-800">{item.productName}</p>
                                                {item.variantName && (
                                                    <p className="text-xs text-gray-500">{item.variantName}</p>
                                                )}
                                            </div>
                                            <div className="shrink-0 text-right text-sm">
                                                <p>{formatPrice(item.price)}</p>
                                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <dl className="space-y-1 border-t pt-3">
                                    <Row label={t('seller.slip.subtotal')} value={formatPrice(order.subtotal)} />
                                    <Row label={t('seller.slip.shipping')} value={formatPrice(order.shippingFee)} />
                                    <Row
                                        label={t('seller.slip.discount')}
                                        value={`-${formatPrice((order.storeDiscount ?? 0) + (order.platformDiscount ?? 0))}`}
                                    />
                                    <Row label={t('seller.slip.total')} value={formatPrice(order.total)} strong />
                                </dl>
                            </section>

                            <div className="space-y-4">
                                <section className="space-y-1 rounded-xl border bg-white p-4 text-sm">
                                    <h2 className="text-base font-semibold text-gray-800">
                                        {t('seller.orders.buyer')}
                                    </h2>
                                    <p className="font-medium text-gray-900">{order.receiverName}</p>
                                    <p>
                                        <a
                                            href={`tel:${order.receiverPhone}`}
                                            className="text-brand-600 hover:underline"
                                        >
                                            {order.receiverPhone}
                                        </a>
                                    </p>
                                    <p className="text-gray-700">{order.shippingAddress}</p>
                                    {order.note && (
                                        <p className="mt-2 rounded-md bg-amber-50 p-2 text-amber-800">
                                            {t('seller.orders.buyerNote', { note: order.note })}
                                        </p>
                                    )}
                                </section>
                                <section className="space-y-1 rounded-xl border bg-white p-4 text-sm">
                                    <h2 className="text-base font-semibold text-gray-800">
                                        {t('seller.orders.payment')}
                                    </h2>
                                    <p>
                                        {t('seller.orders.paymentMethod', { method: order.paymentMethod })} ·{' '}
                                        {t(`seller.orders.paymentStatus.${order.paymentStatus}`)}
                                    </p>
                                    {order.shipperName && (
                                        <p className="text-gray-700">
                                            {t('seller.orders.shipper', { name: order.shipperName })}
                                            {order.shipperPhone && ` · ${order.shipperPhone}`}
                                        </p>
                                    )}
                                </section>
                                {order.deliveryProofUrl && (
                                    <section className="space-y-2 rounded-xl border bg-white p-4">
                                        <h2 className="text-base font-semibold text-gray-800">
                                            {t('seller.orders.proof')}
                                        </h2>
                                        <SmartImage
                                            src={order.deliveryProofUrl}
                                            alt={t('seller.orders.proof')}
                                            className="max-h-60 w-full rounded-md border object-contain"
                                        />
                                    </section>
                                )}
                            </div>
                        </div>

                        <section className="rounded-xl border bg-white p-4">
                            <h2 className="mb-3 text-base font-semibold text-gray-800">{t('seller.orders.history')}</h2>
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('seller.orders.noHistory')}</p>
                            ) : (
                                <ol className="relative space-y-4 border-l border-gray-200 pl-5">
                                    {history.map((entry, index) => (
                                        <li
                                            key={entry.id ?? `${entry.createdDate}-${index}`}
                                            className="relative text-sm"
                                        >
                                            <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                                            <p className="font-medium text-gray-800">
                                                {isReturnHistoryAction(entry.action)
                                                    ? t(`seller.returns.action.${entry.action}`, {
                                                          defaultValue: entry.action,
                                                      })
                                                    : entry.statusAfter
                                                      ? t(`seller.orderStatus.${entry.statusAfter}`, {
                                                            defaultValue: entry.statusAfter,
                                                        })
                                                      : entry.action}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDateTime(entry.createdDate)} ·{' '}
                                                {t(`seller.orders.source.${entry.source}`, {
                                                    defaultValue: entry.source,
                                                })}
                                                {entry.actor && ` (${entry.actor})`}
                                            </p>
                                            {entry.note && <p className="mt-0.5 text-gray-600">{entry.note}</p>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </div>
                    <PackingSlip order={order} />
                </>
            )}
            {dialog}
        </SellerShell>
    )
}
