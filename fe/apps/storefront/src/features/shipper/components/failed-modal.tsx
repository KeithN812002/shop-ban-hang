import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, Select, Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { useFailed } from '../queries'
import { MAX_DELIVERY_ATTEMPTS, type FailureReason } from '../types'

const REASONS: FailureReason[] = ['RECEIVER_ABSENT', 'WRONG_ADDRESS', 'REFUSED', 'PHONE_UNREACHABLE', 'OTHER']

interface FailedModalProps {
    open: boolean
    orderId: Uuid
    /** Failed attempts already recorded (the one being reported is the next). */
    attempts: number
    onClose: () => void
}

export function FailedModal({ open, orderId, attempts, onClose }: FailedModalProps) {
    const { t } = useTranslation()
    const failed = useFailed()
    const [reason, setReason] = useState<FailureReason>('RECEIVER_ABSENT')
    const [note, setNote] = useState('')

    useEffect(() => {
        if (open) {
            setReason('RECEIVER_ABSENT')
            setNote('')
        }
    }, [open])

    const noteMissing = reason === 'OTHER' && note.trim().length === 0
    const willReturn = attempts + 1 >= MAX_DELIVERY_ATTEMPTS

    const submit = () => {
        const label = t(`shipper.failed.reasons.${reason}`)
        const text = note.trim() ? `${label} - ${note.trim()}` : label
        failed.mutate(
            { id: orderId, reason: text },
            {
                onSuccess: () => {
                    notify.info(t(willReturn ? 'shipper.failed.returned' : 'shipper.failed.recorded'))
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('shipper.failed.title')}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('seller.common.cancel')}
                    </Button>
                    <Button variant="danger" disabled={noteMissing} loading={failed.isPending} onClick={submit}>
                        {t('shipper.failed.confirm')}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <p className="text-sm text-gray-700">
                    {t('shipper.card.attempts', { count: attempts, max: MAX_DELIVERY_ATTEMPTS })}
                </p>
                {willReturn && (
                    <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {t('shipper.failed.lastAttemptWarning', { max: MAX_DELIVERY_ATTEMPTS })}
                    </p>
                )}
                <Field label={t('shipper.failed.reason')} required>
                    <Select value={reason} onChange={event => setReason(event.target.value as FailureReason)}>
                        {REASONS.map(item => (
                            <option key={item} value={item}>
                                {t(`shipper.failed.reasons.${item}`)}
                            </option>
                        ))}
                    </Select>
                </Field>
                <Field
                    label={t('shipper.failed.note')}
                    required={reason === 'OTHER'}
                    error={noteMissing ? t('shipper.failed.noteRequired') : undefined}
                >
                    <Textarea rows={3} maxLength={300} value={note} onChange={event => setNote(event.target.value)} />
                </Field>
            </div>
        </Modal>
    )
}
