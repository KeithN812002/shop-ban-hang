import { useState, type ReactNode } from 'react'
import { Gavel, Info, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReturnRequestDetails } from '@/components/order/return-request-details'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SmartImage } from '@/components/ui/smart-image'
import { formatDateTime } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { OrderDetailResponse, ReturnRequestResponse } from '@/types/shop'
import { canDisputeReturn, canWithdrawReturn } from '../lib/return-flow'
import { useWithdrawReturn } from '../queries'
import { ReturnDisputeModal } from './return-dispute-modal'
import { ReturnStepper } from './return-stepper'

const requestTone: Record<ReturnRequestResponse['status'], string> = {
    REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    DISPUTED: 'bg-orange-50 text-orange-700 border-orange-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
}

function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
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

/** Buyer-side return panel on the order detail: request, progress, seller/admin answers and the available actions. */
export function ReturnPanel({ order }: { order: OrderDetailResponse }) {
    const { t, i18n } = useTranslation()
    const withdraw = useWithdrawReturn()
    const [disputeOpen, setDisputeOpen] = useState(false)
    const [withdrawOpen, setWithdrawOpen] = useState(false)
    const request = order.returnRequest
    if (!request) return null

    const date = (iso: string | null) => formatDateTime(iso, i18n.language)
    const showWithdraw = canWithdrawReturn(order.status, request)
    const showDispute = canDisputeReturn(order.status, request)

    const submitWithdraw = () =>
        withdraw.mutate(order.id, {
            onSuccess: () => {
                notify.success(t('order.return.withdrawn'))
                setWithdrawOpen(false)
            },
        })

    return (
        <section className="space-y-3 rounded-xl bg-white p-4" aria-label={t('order.return.panelTitle')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{t('order.return.panelTitle')}</h2>
                <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${requestTone[request.status] ?? requestTone.CLOSED}`}
                >
                    {t(`order.return.requestStatus.${request.status}`, { defaultValue: request.status })}
                </span>
            </div>

            <ReturnStepper orderStatus={order.status} requestStatus={request.status} />

            {order.status === 'RETURN_REQUESTED' && request.status === 'REQUESTED' && (
                <Notice>
                    {t('order.return.waitingSeller')}
                    {request.responseDeadline && (
                        <span className="block text-xs">
                            {t('order.return.responseDeadline', { date: date(request.responseDeadline) })}
                        </span>
                    )}
                </Notice>
            )}
            {order.status === 'RETURN_APPROVED' && <Notice>{t('order.return.approvedHint')}</Notice>}
            {order.status === 'RETURN_SHIPPING' && <Notice>{t('order.return.shippingHint')}</Notice>}
            {order.status === 'RETURN_RECEIVED' && <Notice>{t('order.return.receivedHint')}</Notice>}
            {order.status === 'REFUNDED' && <Notice>{t('order.return.refundedHint')}</Notice>}
            {(request.status === 'CANCELLED' || request.status === 'CLOSED') && (
                <Notice>{t('order.return.closedHint')}</Notice>
            )}

            {request.status === 'REJECTED' && (
                <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                    <p className="font-semibold text-red-700">{t('order.return.rejectedTitle')}</p>
                    {request.sellerNote && (
                        <p className="text-gray-800">
                            <span className="font-medium">{t('order.return.sellerNote')}:</span> {request.sellerNote}
                        </p>
                    )}
                    <p className="text-gray-700">{t('order.return.rejectedHint')}</p>
                    {request.disputeDeadline && (
                        <p className="text-xs text-gray-600">
                            {showDispute
                                ? t('order.return.disputeDeadline', { date: date(request.disputeDeadline) })
                                : t('order.return.disputeExpired')}
                        </p>
                    )}
                </div>
            )}

            {request.status === 'DISPUTED' && (
                <div className="space-y-2">
                    <Notice tone="warn">{t('order.return.disputeInReview')}</Notice>
                    {request.sellerNote && (
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{t('order.return.sellerNote')}:</span> {request.sellerNote}
                        </p>
                    )}
                    {request.disputeReason && (
                        <p className="text-sm text-gray-700">
                            <span className="font-medium">{t('order.return.disputeContent')}:</span>{' '}
                            {request.disputeReason}
                        </p>
                    )}
                </div>
            )}

            {request.adminNote && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                    <span className="font-medium">{t('order.return.adminNote')}:</span> {request.adminNote}
                </p>
            )}

            {request.status === 'APPROVED' && request.sellerNote && (
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{t('order.return.sellerNote')}:</span> {request.sellerNote}
                </p>
            )}

            <ReturnRequestDetails request={request} />

            {order.status === 'REFUNDED' && (request.refundProofUrl || request.refundNote) && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    {request.refundedAt && (
                        <p className="font-medium text-emerald-800">
                            {t('order.return.refundedAt', { date: date(request.refundedAt) })}
                        </p>
                    )}
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

            {(showDispute || showWithdraw) && (
                <div className="flex flex-wrap gap-2 border-t pt-3">
                    {showDispute && (
                        <Button icon={<Gavel />} onClick={() => setDisputeOpen(true)}>
                            {t('order.return.dispute')}
                        </Button>
                    )}
                    {showWithdraw && (
                        <Button variant="outline" icon={<Undo2 />} onClick={() => setWithdrawOpen(true)}>
                            {t('order.return.withdraw')}
                        </Button>
                    )}
                </div>
            )}

            <ReturnDisputeModal
                open={disputeOpen}
                orderId={order.id}
                deadline={request.disputeDeadline}
                onClose={() => setDisputeOpen(false)}
            />
            <Modal
                open={withdrawOpen}
                onClose={() => setWithdrawOpen(false)}
                size="sm"
                title={t('order.return.withdrawTitle')}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
                            {t('common.back')}
                        </Button>
                        <Button variant="danger" loading={withdraw.isPending} onClick={submitWithdraw}>
                            {t('order.return.withdraw')}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-700">{t('order.return.withdrawMessage')}</p>
            </Modal>
        </section>
    )
}
