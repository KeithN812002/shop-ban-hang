import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Circle, PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { OrderStatusBadge } from '@/components/order/order-status-badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { Field, Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { SmartImage } from '@/components/ui/smart-image'
import { ReturnPanel } from '@/features/orders/components/return-panel'
import { ReturnRequestModal } from '@/features/orders/components/return-request-modal'
import { ReviewModal } from '@/features/orders/components/review-modal'
import { canBuyerCancel } from '@/features/orders/constants'
import { isReturnHistoryAction } from '@/features/orders/lib/return-flow'
import { useCancelOrder, useConfirmReceived, useOrder } from '@/features/orders/queries'
import { formatDateTime, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { OrderItemResponse } from '@/types/shop'

export const Route = createFileRoute('/account/orders/$id')({ component: OrderDetailPage })

function OrderDetailPage() {
    const { id } = Route.useParams()
    const { t, i18n } = useTranslation()
    const order = useOrder(id)
    const cancel = useCancelOrder()
    const confirm = useConfirmReceived()
    const [cancelOpen, setCancelOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [returnOpen, setReturnOpen] = useState(false)
    const [reviewItem, setReviewItem] = useState<OrderItemResponse | null>(null)

    if (order.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />
    if (order.isError || !order.data) return <ErrorState onRetry={() => void order.refetch()} />

    const o = order.data
    const reasonValid = reason.trim().length >= 3
    const canReview = o.status === 'COMPLETED' || o.status === 'DELIVERED'
    // Oldest first; the last entry is the current state.
    const history = [...o.history].sort((a, b) => a.createdDate.localeCompare(b.createdDate))

    const submitCancel = () => {
        if (!reasonValid) return
        cancel.mutate(
            { id: o.id, reason: reason.trim() },
            {
                onSuccess: () => {
                    notify.success(t('order.cancelled'))
                    setCancelOpen(false)
                    setReason('')
                },
            },
        )
    }

    return (
        <div className="space-y-3">
            <Link
                to="/account/orders"
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600"
            >
                <ArrowLeft className="size-4" aria-hidden />
                {t('order.backToList')}
            </Link>

            <section className="rounded-xl bg-white p-4" aria-label={t('order.detail')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-lg font-bold text-gray-900">
                        {t('order.code')}: <span className="font-mono">{o.code}</span>
                    </h1>
                    <OrderStatusBadge status={o.status} />
                </div>
                {o.status === 'CANCELLED' && o.cancelReason && (
                    <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                        {t('order.cancelReason')}: {o.cancelReason}
                    </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                    {canBuyerCancel(o.status) && (
                        <Button variant="outline" onClick={() => setCancelOpen(true)}>
                            {t('order.cancel')}
                        </Button>
                    )}
                    {o.status === 'DELIVERED' && (
                        <Button
                            loading={confirm.isPending}
                            icon={<CheckCircle2 />}
                            onClick={() =>
                                confirm.mutate(o.id, { onSuccess: () => notify.success(t('order.received')) })
                            }
                        >
                            {t('order.confirmReceived')}
                        </Button>
                    )}
                    {o.canRequestReturn && (
                        <Button variant="outline" icon={<PackageX />} onClick={() => setReturnOpen(true)}>
                            {t('order.return.request')}
                        </Button>
                    )}
                </div>
                {o.canRequestReturn && o.returnDeadline && (
                    <p className="mt-2 text-xs text-gray-500">
                        {t('order.return.deadline', { date: formatDateTime(o.returnDeadline, i18n.language) })}
                    </p>
                )}
            </section>

            <ReturnPanel order={o} />

            <section className="rounded-xl bg-white p-4" aria-label={t('order.timeline')}>
                <h2 className="mb-3 font-semibold text-gray-900">{t('order.timeline')}</h2>
                {history.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('order.noHistory')}</p>
                ) : (
                    <ol className="space-y-0">
                        {history.map((entry, index) => {
                            const last = index === history.length - 1
                            return (
                                <li
                                    key={`${entry.createdDate}-${index}`}
                                    className="relative flex gap-3 pb-5 last:pb-0"
                                >
                                    {!last && (
                                        <span
                                            className="absolute top-5 left-[9px] h-full w-px bg-gray-200"
                                            aria-hidden
                                        />
                                    )}
                                    <Circle
                                        className={cn(
                                            'relative z-10 size-5 shrink-0 bg-white',
                                            last ? 'fill-brand-500 text-brand-500' : 'text-gray-300',
                                        )}
                                        aria-hidden
                                    />
                                    <div className="text-sm">
                                        <p className={cn('font-medium', last ? 'text-brand-600' : 'text-gray-800')}>
                                            {isReturnHistoryAction(entry.action)
                                                ? t(`order.return.action.${entry.action}`, {
                                                      defaultValue: entry.action,
                                                  })
                                                : entry.statusAfter
                                                  ? t(`order.status.${entry.statusAfter}`, {
                                                        defaultValue: entry.action,
                                                    })
                                                  : entry.action}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDateTime(entry.createdDate, i18n.language)} |{' '}
                                            {t(`order.source.${entry.source}`, { defaultValue: entry.source })}
                                        </p>
                                        {entry.note && <p className="mt-0.5 text-gray-600">{entry.note}</p>}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                )}
            </section>

            <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4">
                    <h2 className="mb-2 font-semibold text-gray-900">{t('order.shippingInfo')}</h2>
                    <p className="text-sm font-medium">{o.receiverName}</p>
                    <p className="text-sm text-gray-600">{o.receiverPhone}</p>
                    <p className="text-sm text-gray-600">{o.shippingAddress}</p>
                    {o.shipperName && (
                        <p className="mt-2 text-sm text-gray-600">
                            {t('order.shipper')}: {o.shipperName}
                            {o.shipperPhone && ` (${o.shipperPhone})`}
                        </p>
                    )}
                    {o.note && (
                        <p className="mt-2 text-sm text-gray-600">
                            {t('checkout.note')}: {o.note}
                        </p>
                    )}
                </div>
                <div className="rounded-xl bg-white p-4">
                    <h2 className="mb-2 font-semibold text-gray-900">{t('order.paymentInfo')}</h2>
                    <p className="text-sm text-gray-700">
                        {t('checkout.cod')} - {t(`order.paymentStatus.${o.paymentStatus}`)}
                    </p>
                    {o.deliveryProofUrl && (
                        <a href={o.deliveryProofUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                            <SmartImage
                                src={o.deliveryProofUrl}
                                alt={t('order.deliveryProof')}
                                className="size-20 rounded-md border object-cover"
                            />
                        </a>
                    )}
                </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-white" aria-label={t('order.items')}>
                <header className="border-b px-4 py-3 font-semibold">
                    {o.storeId ? (
                        <Link to="/store/$id" params={{ id: o.storeId }} className="hover:text-brand-600">
                            {o.storeName || t('order.store')}
                        </Link>
                    ) : (
                        o.storeName
                    )}
                </header>
                <ul className="divide-y">
                    {o.items.map(item => (
                        <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <Link to="/product/$id" params={{ id: item.productId }} className="shrink-0">
                                <SmartImage
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="size-16 rounded-md border object-cover"
                                />
                            </Link>
                            <div className="min-w-0 flex-1 basis-40">
                                <p className="line-clamp-2 text-sm">{item.productName}</p>
                                {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                            {canReview &&
                                (item.reviewed ? (
                                    <span className="text-xs text-emerald-600">{t('review.reviewed')}</span>
                                ) : (
                                    <Button size="sm" variant="soft" onClick={() => setReviewItem(item)}>
                                        {t('review.write')}
                                    </Button>
                                ))}
                        </li>
                    ))}
                </ul>
                <dl className="space-y-1 border-t px-4 py-3 text-sm">
                    <Row label={t('checkout.subtotal')} value={formatPrice(o.subtotal)} />
                    <Row label={t('checkout.shippingFee')} value={formatPrice(o.shippingFee)} />
                    {o.storeDiscount > 0 && (
                        <Row
                            label={t('checkout.storeDiscount')}
                            value={`-${formatPrice(o.storeDiscount)}`}
                            tone="good"
                        />
                    )}
                    {o.platformDiscount > 0 && (
                        <Row
                            label={t('checkout.platformDiscount')}
                            value={`-${formatPrice(o.platformDiscount)}`}
                            tone="good"
                        />
                    )}
                    <div className="flex items-baseline justify-between border-t pt-2">
                        <dt className="font-semibold">{t('checkout.total')}</dt>
                        <dd className="text-xl font-bold text-brand-600">{formatPrice(o.total)}</dd>
                    </div>
                </dl>
            </section>

            <Modal
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
                title={t('order.cancelTitle')}
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCancelOpen(false)}>
                            {t('common.back')}
                        </Button>
                        <Button
                            variant="danger"
                            loading={cancel.isPending}
                            disabled={!reasonValid}
                            onClick={submitCancel}
                        >
                            {t('order.cancel')}
                        </Button>
                    </>
                }
            >
                <Field label={t('order.cancelReasonLabel')} required>
                    <Textarea
                        rows={3}
                        maxLength={300}
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        placeholder={t('order.cancelReasonPlaceholder')}
                    />
                </Field>
            </Modal>

            <ReturnRequestModal open={returnOpen} order={o} onClose={() => setReturnOpen(false)} />
            <ReviewModal item={reviewItem} onClose={() => setReviewItem(null)} />
        </div>
    )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
    return (
        <div className={cn('flex justify-between', tone === 'good' && 'text-emerald-600')}>
            <dt className={tone ? undefined : 'text-gray-600'}>{label}</dt>
            <dd>{value}</dd>
        </div>
    )
}
