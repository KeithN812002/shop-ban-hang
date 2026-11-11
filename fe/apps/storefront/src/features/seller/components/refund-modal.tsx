import { useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ReturnRequestDetails } from '@/components/order/return-request-details'
import { ImageUploader } from '@/components/common/image-uploader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import type { ReturnRequestResponse } from '@/types/shop'
import { useMarkReturnRefunded } from '../queries'

interface RefundModalProps {
    open: boolean
    orderId: Uuid
    request: ReturnRequestResponse
    onClose: () => void
}

/** Seller records the manual bank transfer: optional receipt image + note. Bank info is shown to copy. */
export function RefundModal({ open, orderId, request, onClose }: RefundModalProps) {
    const { t } = useTranslation()
    const refund = useMarkReturnRefunded()
    const [proof, setProof] = useState<string[]>([])
    const [note, setNote] = useState('')

    useEffect(() => {
        if (open) {
            setProof([])
            setNote('')
        }
    }, [open])

    const submit = () =>
        refund.mutate(
            { id: orderId, proofImageUrl: proof[0], note: note.trim() || undefined },
            {
                onSuccess: () => {
                    notify.success(t('seller.returns.refundDone'))
                    onClose()
                },
            },
        )

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            title={t('seller.returns.refundTitle')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('seller.common.cancel')}
                    </Button>
                    <Button icon={<Banknote />} loading={refund.isPending} onClick={submit}>
                        {t('seller.returns.refunded')}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                    {t('seller.returns.refundHint', { amount: formatPrice(request.refundAmount) })}
                </p>
                <ReturnRequestDetails request={{ ...request, imageUrls: [], description: null }} copyable />
                <ImageUploader value={proof} onChange={setProof} max={1} label={t('seller.returns.refundProof')} />
                <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">{t('seller.returns.refundNote')}</span>
                    <Textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)} />
                </label>
            </div>
        </Modal>
    )
}
