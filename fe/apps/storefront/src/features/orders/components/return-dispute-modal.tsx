import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { formatDateTime } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { isValidDisputeReason } from '../lib/return-schema'
import { useDisputeReturn } from '../queries'

interface ReturnDisputeModalProps {
    open: boolean
    orderId: Uuid
    /** Last moment the buyer may dispute (shown as a hint). */
    deadline: string | null
    onClose: () => void
}

/** Buyer disputes a seller rejection; an admin then decides. */
export function ReturnDisputeModal({ open, orderId, deadline, onClose }: ReturnDisputeModalProps) {
    const { t, i18n } = useTranslation()
    const dispute = useDisputeReturn()
    const [reason, setReason] = useState('')
    const [touched, setTouched] = useState(false)
    const valid = isValidDisputeReason(reason)

    useEffect(() => {
        if (open) {
            setReason('')
            setTouched(false)
        }
    }, [open])

    const submit = () => {
        setTouched(true)
        if (!valid) return
        dispute.mutate(
            { orderId, reason: reason.trim() },
            {
                onSuccess: () => {
                    notify.success(t('order.return.disputed'))
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={t('order.return.disputeTitle')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.back')}
                    </Button>
                    <Button loading={dispute.isPending} onClick={submit}>
                        {t('order.return.disputeSubmit')}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                {deadline && (
                    <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                        {t('order.return.disputeDeadline', { date: formatDateTime(deadline, i18n.language) })}
                    </p>
                )}
                <Field
                    label={t('order.return.disputeReasonLabel')}
                    error={touched && !valid ? t('order.return.validation.disputeReason') : undefined}
                    required
                >
                    <Textarea
                        rows={4}
                        maxLength={1000}
                        value={reason}
                        invalid={touched && !valid}
                        onChange={event => setReason(event.target.value)}
                        placeholder={t('order.return.disputePlaceholder')}
                    />
                </Field>
            </div>
        </Modal>
    )
}
