import { useState, type ReactNode } from 'react'
import { Banknote, Check, Info, PackageCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReturnRequestDetails } from '@/components/order/return-request-details'
import { Button } from '@/components/ui/button'
import { SmartImage } from '@/components/ui/smart-image'
import { ReturnStepper } from '@/features/orders/components/return-stepper'
import { canSellerRespond } from '@/features/orders/lib/return-flow'
import { formatDateTime } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { OrderDetailResponse } from '@/types/shop'
import { useApproveReturn, useConfirmReturnReceived, useRejectReturn } from '../queries'
import { useConfirm } from './confirm-dialog'
import { RefundModal } from './refund-modal'

function Hint({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
    return (
        <p
            className={
                tone === 'warn'
                    ? 'flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800'
                    : 'flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800'
            }
        >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{children}</span>
        </p>
    )
}

/** Seller-side return panel: request details plus the actions allowed for the current step (contract §12.3). */
export function ReturnPanel({ order }: { order: OrderDetailResponse }) {
    const { t } = useTranslation()
    const approve = useApproveReturn()
    const reject = useRejectReturn()
    const received = useConfirmReturnReceived()
    const { ask, dialog } = useConfirm()
    const [refundOpen, setRefundOpen] = useState(false)
    const request = order.returnRequest
    if (!request) return null

    const busy = approve.isPending || reject.isPending || received.isPending
    const canRespond = canSellerRespond(order.status, request)

    const handleApprove = async () => {
        const result = await ask({
            title: t('seller.returns.approveTitle'),
            message: t('seller.returns.approveMessage'),
            confirmLabel: t('seller.returns.approve'),
            reason: { label: t('seller.returns.approveNote') },
        })
        if (!result) return
        approve.mutate(
            { id: order.id, note: result.reason || undefined },
            { onSuccess: () => notify.success(t('seller.returns.approved')) },
        )
    }

    const handleReject = async () => {
        const result = await ask({
            title: t('seller.returns.rejectTitle'),
            message: t('seller.returns.rejectMessage'),
            confirmLabel: t('seller.returns.reject'),
            destructive: true,
            reason: { label: t('seller.returns.rejectReason'), required: true },
        })
        if (!result) return
        reject.mutate(
            { id: order.id, reason: result.reason },
            { onSuccess: () => notify.success(t('seller.returns.rejected')) },
        )
    }

    const handleReceived = async () => {
        const result = await ask({
            title: t('seller.returns.confirmReceivedTitle'),
            message: t('seller.returns.confirmReceivedMessage'),
            confirmLabel: t('seller.returns.confirmReceived'),
        })
        if (!result) return
        received.mutate(order.id, { onSuccess: () => notify.success(t('seller.returns.receivedConfirmed')) })
    }

    return (
        <section className="space-y-3 rounded-xl border bg-white p-4" aria-label={t('seller.returns.title')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-800">{t('seller.returns.title')}</h2>
                <span className="rounded-full border bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {t(`order.return.requestStatus.${request.status}`, { defaultValue: request.status })}
                </span>
            </div>

            <ReturnStepper orderStatus={order.status} requestStatus={request.status} />

            {canRespond && (
                <Hint tone="warn">
                    {t('seller.returns.autoApproveHint')}
                    {request.responseDeadline && (
                        <span className="block font-medium">
                            {t('seller.returns.responseDeadline', { date: formatDateTime(request.responseDeadline) })}
                        </span>
                    )}
                </Hint>
            )}
            {order.status === 'RETURN_APPROVED' && <Hint>{t('seller.returns.waitingShipper')}</Hint>}
            {order.status === 'RETURN_SHIPPING' && <Hint>{t('seller.returns.shippingHint')}</Hint>}
            {order.status === 'RETURN_RECEIVED' && <Hint tone="warn">{t('seller.returns.receivedHint')}</Hint>}
            {order.status === 'RETURN_REQUESTED' && request.status === 'REJECTED' && (
                <Hint>{t('seller.returns.rejectedHint')}</Hint>
            )}
            {request.status === 'DISPUTED' && <Hint tone="warn">{t('seller.returns.disputeHint')}</Hint>}

            {request.sellerNote && (
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('order.return.sellerNote')}:</span> {request.sellerNote}
                </p>
            )}
            {request.disputeReason && (
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('order.return.disputeContent')}:</span> {request.disputeReason}
                </p>
            )}
            {request.adminNote && (
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('order.return.adminNote')}:</span> {request.adminNote}
                </p>
            )}

            <ReturnRequestDetails
                request={request}
                copyable={order.status === 'RETURN_RECEIVED' || order.status === 'REFUNDED'}
            />

            {order.status === 'REFUNDED' && (request.refundProofUrl || request.refundNote) && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    {request.refundProofUrl && (
                        <a
                            href={request.refundProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                        >
                            <p className="mb-1 font-medium text-gray-700">{t('order.return.refundProof')}</p>
                            <SmartImage
                                src={request.refundProofUrl}
                                alt={t('order.return.refundProof')}
                                className="max-h-48 rounded-md border object-contain"
                            />
                        </a>
                    )}
                    {request.refundNote && (
                        <p className="text-gray-800">
                            <span className="font-medium">{t('order.return.refundNote')}:</span> {request.refundNote}
                        </p>
                    )}
                </div>
            )}

            {(canRespond || order.status === 'RETURN_SHIPPING' || order.status === 'RETURN_RECEIVED') && (
                <div className="flex flex-wrap gap-2 border-t pt-3">
                    {canRespond && (
                        <>
                            <Button
                                icon={<Check />}
                                loading={approve.isPending}
                                disabled={busy}
                                onClick={() => void handleApprove()}
                            >
                                {t('seller.returns.approve')}
                            </Button>
                            <Button
                                variant="danger"
                                icon={<X />}
                                loading={reject.isPending}
                                disabled={busy}
                                onClick={() => void handleReject()}
                            >
                                {t('seller.returns.reject')}
                            </Button>
                        </>
                    )}
                    {order.status === 'RETURN_SHIPPING' && (
                        <Button
                            icon={<PackageCheck />}
                            loading={received.isPending}
                            disabled={busy}
                            onClick={() => void handleReceived()}
                        >
                            {t('seller.returns.confirmReceived')}
                        </Button>
                    )}
                    {order.status === 'RETURN_RECEIVED' && (
                        <Button icon={<Banknote />} onClick={() => setRefundOpen(true)}>
                            {t('seller.returns.refunded')}
                        </Button>
                    )}
                </div>
            )}

            <RefundModal open={refundOpen} orderId={order.id} request={request} onClose={() => setRefundOpen(false)} />
            {dialog}
        </section>
    )
}
