import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    HandHelping,
    Info,
    Navigation,
    PackageCheck,
    Phone,
    Undo2,
    XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { SmartImage } from '@/components/ui/smart-image'
import { OrderStatusPill } from '@/features/seller/components/order-status'
import { formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { DeliverModal } from '../components/deliver-modal'
import { DeliveryStepper } from '../components/delivery-stepper'
import { FailedModal } from '../components/failed-modal'
import { ShipperShell } from '../components/shipper-shell'
import { attemptsOf, codAmountOf, isReturnJob, mapsDirectionsUrl, pickupAddressOf } from '../lib/order-utils'
import { useAcceptAction } from '../lib/use-accept-action'
import { usePickedUp, useShipperOrder } from '../queries'
import { MAX_DELIVERY_ATTEMPTS } from '../types'

interface PlaceCardProps {
    title: string
    name?: string | null
    phone?: string | null
    address: string
    directions: string
    phoneLabel: string
    directionsLabel: string
}

function PlaceCard({ title, name, phone, address, directions, phoneLabel, directionsLabel }: PlaceCardProps) {
    return (
        <section className="space-y-2 rounded-xl border bg-white p-4 text-sm">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{title}</h2>
            {name && <p className="font-semibold text-gray-900">{name}</p>}
            <p className="text-gray-700">{address || '—'}</p>
            <div className="flex flex-wrap gap-2 pt-1">
                {phone && (
                    <a
                        href={`tel:${phone}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-300 px-3 font-medium text-gray-800 hover:border-brand-500"
                    >
                        <Phone className="size-4" aria-hidden />
                        {phoneLabel}: {phone}
                    </a>
                )}
                {address && (
                    <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-sky-600 px-3 font-medium text-white hover:bg-sky-700"
                    >
                        <Navigation className="size-4" aria-hidden />
                        {directionsLabel}
                    </a>
                )}
            </div>
        </section>
    )
}

export function ShipperOrderDetailPage({ orderId }: { orderId: Uuid }) {
    const { t } = useTranslation()
    const query = useShipperOrder(orderId)
    const accept = useAcceptAction()
    const pickedUp = usePickedUp()
    const [deliverOpen, setDeliverOpen] = useState(false)
    const [failedOpen, setFailedOpen] = useState(false)
    const order = query.data

    const attempts = order ? attemptsOf(order) : 0
    const cod = order ? codAmountOf(order) : 0
    const pickup = order ? pickupAddressOf(order) : ''
    const returnJob = order ? isReturnJob(order) : false

    return (
        <ShipperShell
            title={order ? `#${order.code}` : t('shipper.detail.title')}
            leading={
                <Link
                    to="/shipper/orders"
                    aria-label={t('seller.common.back')}
                    className="-ml-1 rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
                >
                    <ArrowLeft className="size-5" />
                </Link>
            }
        >
            {query.isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}

            {order && (
                <>
                    <DeliveryStepper status={order.status} jobType={order.jobType} history={order.history} />
                    <section className="space-y-3 rounded-xl border bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="flex flex-wrap items-center gap-2">
                                <OrderStatusPill status={order.status} />
                                {returnJob && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                        <Undo2 className="size-3" aria-hidden />
                                        {t('shipper.card.returnBadge')}
                                    </span>
                                )}
                            </span>
                            {order.status === 'SHIPPING' && (
                                <span className="text-xs font-medium text-amber-700">
                                    {t('shipper.card.attempts', { count: attempts, max: MAX_DELIVERY_ATTEMPTS })}
                                </span>
                            )}
                        </div>
                        {!returnJob && (
                            <>
                                <div className="flex items-center justify-between rounded-lg bg-brand-50 p-3">
                                    <span className="flex items-center gap-2 text-sm font-medium text-brand-700">
                                        <Banknote className="size-5" aria-hidden />
                                        {t('shipper.detail.collect')}
                                    </span>
                                    <span className="text-xl font-bold text-brand-600">{formatPrice(cod)}</span>
                                </div>
                                <dl className="flex justify-between text-sm text-gray-600">
                                    <dt>{t('shipper.detail.shippingFee')}</dt>
                                    <dd className="font-medium text-gray-800">{formatPrice(order.shippingFee)}</dd>
                                </dl>
                            </>
                        )}

                        {(order.status === 'READY_TO_SHIP' || order.status === 'RETURN_APPROVED') && (
                            <Button
                                block
                                size="lg"
                                icon={<HandHelping />}
                                loading={accept.isPending}
                                onClick={() => accept.run(order)}
                            >
                                {t('shipper.available.accept')}
                            </Button>
                        )}
                        {order.status === 'PICKING' && (
                            <Button
                                block
                                size="lg"
                                icon={<PackageCheck />}
                                loading={pickedUp.isPending}
                                onClick={() =>
                                    pickedUp.mutate(order.id, {
                                        onSuccess: () => notify.success(t('shipper.detail.pickedUpDone')),
                                    })
                                }
                            >
                                {t('shipper.detail.pickedUp')}
                            </Button>
                        )}
                        {order.status === 'RETURN_SHIPPING' && (
                            <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                                {t('shipper.detail.returnShippingHint')}
                            </p>
                        )}
                        {order.status === 'RETURNING' && (
                            <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                                {t('shipper.detail.returningHint')}
                            </p>
                        )}
                        {order.status === 'SHIPPING' && (
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="lg" icon={<CheckCircle2 />} onClick={() => setDeliverOpen(true)}>
                                    {t('shipper.detail.delivered')}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="danger"
                                    icon={<XCircle />}
                                    onClick={() => setFailedOpen(true)}
                                >
                                    {t('shipper.detail.failed')}
                                </Button>
                            </div>
                        )}
                    </section>

                    {returnJob ? (
                        <>
                            <PlaceCard
                                title={t('shipper.detail.returnPickup')}
                                name={order.receiverName}
                                phone={order.receiverPhone}
                                address={order.shippingAddress}
                                directions={mapsDirectionsUrl(order.shippingAddress)}
                                phoneLabel={t('shipper.detail.call')}
                                directionsLabel={t('shipper.detail.directions')}
                            />
                            <PlaceCard
                                title={t('shipper.detail.returnDropoff')}
                                name={order.storeName}
                                phone={order.storePhone}
                                address={pickup}
                                directions={mapsDirectionsUrl(pickup)}
                                phoneLabel={t('shipper.detail.call')}
                                directionsLabel={t('shipper.detail.directions')}
                            />
                        </>
                    ) : (
                        <>
                            <PlaceCard
                                title={t('shipper.detail.pickup')}
                                name={order.storeName}
                                phone={order.storePhone}
                                address={pickup}
                                directions={mapsDirectionsUrl(pickup)}
                                phoneLabel={t('shipper.detail.call')}
                                directionsLabel={t('shipper.detail.directions')}
                            />
                            <PlaceCard
                                title={t('shipper.detail.delivery')}
                                name={order.receiverName}
                                phone={order.receiverPhone}
                                address={order.shippingAddress}
                                directions={mapsDirectionsUrl(order.shippingAddress)}
                                phoneLabel={t('shipper.detail.call')}
                                directionsLabel={t('shipper.detail.directions')}
                            />
                        </>
                    )}

                    {order.note && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            {t('shipper.detail.note', { note: order.note })}
                        </p>
                    )}

                    <section className="rounded-xl border bg-white p-4">
                        <h2 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            {t('shipper.detail.items')}
                        </h2>
                        <ul className="divide-y">
                            {order.items.map(item => (
                                <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
                                    <SmartImage
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="size-12 shrink-0 rounded-md border object-cover"
                                    />
                                    <span className="line-clamp-2 min-w-0 flex-1 text-gray-800">
                                        {item.productName}
                                        {item.variantName && (
                                            <span className="text-gray-500"> · {item.variantName}</span>
                                        )}
                                    </span>
                                    <span className="shrink-0 text-gray-600">x{item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {order.deliveryProofUrl && (
                        <section className="space-y-2 rounded-xl border bg-white p-4">
                            <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                {t('shipper.detail.proof')}
                            </h2>
                            <SmartImage
                                src={order.deliveryProofUrl}
                                alt={t('shipper.detail.proof')}
                                className="max-h-64 w-full rounded-md border object-contain"
                            />
                        </section>
                    )}

                    <DeliverModal
                        open={deliverOpen}
                        orderId={order.id}
                        codAmount={cod}
                        onClose={() => setDeliverOpen(false)}
                    />
                    <FailedModal
                        open={failedOpen}
                        orderId={order.id}
                        attempts={attempts}
                        onClose={() => setFailedOpen(false)}
                    />
                </>
            )}
        </ShipperShell>
    )
}
