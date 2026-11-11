import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, Gavel, Undo2, X } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { ActionButton } from '@/components/Common/ActionButton'
import { useDialogTitle } from '@/hooks'
import { DetailList } from '../../components/DetailList'
import { MediaName } from '../../components/MediaName'
import { StatusBadge } from '../../components/StatusBadge'
import {
    ADMIN_CANCELLABLE_ORDER_STATUSES,
    ADMIN_REFUNDABLE_ORDER_STATUS,
    DISPUTED_RETURN_STATUS,
} from '../../constants'
import { formatCount, formatDateTime, formatVnd } from '../../utils/format'
import type { OrderDetailResponse, OrderResponse } from '../../types'
import { OrderTimeline } from './OrderTimeline'
import { ReturnRequestSection } from './ReturnRequestSection'

interface OrderDetailDialogProps {
    isOpen: boolean
    isLoading?: boolean
    order?: OrderDetailResponse
    onClose: () => void
    onAction: (actionId: string, order: OrderResponse) => void
}

const preventSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault()
}

const SectionTitle = ({ children }: { children: string }) => (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
)

export const OrderDetailDialog = memo(({ isOpen, isLoading, order, onClose, onAction }: OrderDetailDialogProps) => {
    const { t } = useTranslation()
    const dialogTitle = useDialogTitle()
    const canCancel = !!order && ADMIN_CANCELLABLE_ORDER_STATUSES.includes(order.status)
    const canConfirmReturned = !!order && order.status === 'RETURNING'
    const canResolveReturn =
        !!order && order.status === 'RETURN_REQUESTED' && order.returnRequest?.status === DISPUTED_RETURN_STATUS
    const canMarkRefunded = !!order && order.status === ADMIN_REFUNDABLE_ORDER_STATUS
    const hasFooter = canCancel || canConfirmReturned || canResolveReturn || canMarkRefunded

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={onClose}
            onSave={preventSubmit}
            title={dialogTitle('view')}
            t={t}
            columns={1}
            className="max-w-4xl"
            footer={
                hasFooter && (
                    <>
                        {canResolveReturn && (
                            <ActionButton
                                actionCode="resolveReturn"
                                icon={Gavel}
                                label={t('shopAdmin.actions.resolveReturn')}
                                onPress={() => onAction('resolveReturn', order)}
                            />
                        )}
                        {canMarkRefunded && (
                            <ActionButton
                                actionCode="markRefunded"
                                icon={Banknote}
                                label={t('shopAdmin.actions.markRefunded')}
                                onPress={() => onAction('markRefunded', order)}
                            />
                        )}
                        {canConfirmReturned && (
                            <ActionButton
                                actionCode="confirmReturned"
                                icon={Undo2}
                                label={t('shopAdmin.actions.confirmReturned')}
                                onPress={() => onAction('confirmReturned', order)}
                            />
                        )}
                        {canCancel && (
                            <ActionButton
                                actionCode="cancel"
                                icon={X}
                                variant="destructive"
                                label={t('shopAdmin.actions.cancelOrder')}
                                onPress={() => onAction('cancel', order)}
                            />
                        )}
                    </>
                )
            }
        >
            <LoadingOverlay isLoading={!!isLoading} text={t('common.loading')}>
                {order ? (
                    <div className="space-y-6">
                        <DetailList
                            items={[
                                { label: t('shopAdmin.order.fields.code'), value: order.code },
                                {
                                    label: t('common.status'),
                                    value: <StatusBadge domain="order" status={order.status} />,
                                },
                                {
                                    label: t('shopAdmin.order.fields.store'),
                                    value: order.storeName ?? order.store?.name,
                                },
                                {
                                    label: t('shopAdmin.order.fields.buyer'),
                                    value: order.buyerName ?? order.buyerUsername,
                                },
                                { label: t('shopAdmin.order.fields.receiver'), value: order.receiverName },
                                { label: t('shopAdmin.order.fields.receiverPhone'), value: order.receiverPhone },
                                {
                                    label: t('shopAdmin.order.fields.shippingAddress'),
                                    value: order.shippingAddress,
                                    wide: true,
                                },
                                { label: t('shopAdmin.order.fields.shipper'), value: order.shipperName },
                                { label: t('shopAdmin.order.fields.shipperPhone'), value: order.shipperPhone },
                                {
                                    label: t('shopAdmin.order.fields.paymentStatus'),
                                    value: <StatusBadge domain="payment" status={order.paymentStatus} />,
                                },
                                { label: t('common.audit.createdDate'), value: formatDateTime(order.createdDate) },
                                { label: t('shopAdmin.order.fields.note'), value: order.note, wide: true },
                                {
                                    label: t('shopAdmin.reason.cancelReason'),
                                    value: order.cancelReason
                                        ? `${order.cancelReason}${order.cancelledBy ? ` (${order.cancelledBy})` : ''}`
                                        : undefined,
                                    wide: true,
                                },
                            ]}
                        />

                        {order.returnRequest && (
                            <section>
                                <SectionTitle>{t('shopAdmin.order.return.section')}</SectionTitle>
                                <ReturnRequestSection request={order.returnRequest} />
                            </section>
                        )}

                        <section>
                            <SectionTitle>{t('shopAdmin.order.items')}</SectionTitle>
                            <ul className="divide-y rounded-md border text-sm">
                                {order.items.map(item => (
                                    <li key={item.id} className="flex items-center justify-between gap-4 px-3 py-2">
                                        <MediaName
                                            name={item.productName}
                                            imageUrl={item.imageUrl}
                                            subtitle={item.variantName}
                                        />
                                        <span className="shrink-0 text-muted-foreground">
                                            {formatVnd(item.price)} &times; {formatCount(item.quantity)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <SectionTitle>{t('shopAdmin.order.amounts')}</SectionTitle>
                            <DetailList
                                items={[
                                    { label: t('shopAdmin.order.fields.subtotal'), value: formatVnd(order.subtotal) },
                                    {
                                        label: t('shopAdmin.order.fields.shippingFee'),
                                        value: formatVnd(order.shippingFee),
                                    },
                                    {
                                        label: t('shopAdmin.order.fields.storeDiscount'),
                                        value: formatVnd(order.storeDiscount),
                                    },
                                    {
                                        label: t('shopAdmin.order.fields.platformDiscount'),
                                        value: formatVnd(order.platformDiscount),
                                    },
                                    { label: t('shopAdmin.order.fields.total'), value: formatVnd(order.total) },
                                    {
                                        label: t('shopAdmin.order.fields.platformFee'),
                                        value: formatVnd(order.platformFee),
                                    },
                                    {
                                        label: t('shopAdmin.order.fields.sellerIncome'),
                                        value: formatVnd(order.sellerIncome),
                                    },
                                    {
                                        label: t('shopAdmin.order.fields.shipperFee'),
                                        value: formatVnd(order.shipperFee),
                                    },
                                ]}
                            />
                        </section>

                        <section>
                            <SectionTitle>{t('shopAdmin.order.history')}</SectionTitle>
                            <OrderTimeline history={order.history} />
                        </section>
                    </div>
                ) : (
                    !isLoading && <EmptyState kind="no-records" variant="compact" />
                )}
            </LoadingOverlay>
        </FormDialogContent>
    )
})

OrderDetailDialog.displayName = 'OrderDetailDialog'
