import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { SmartImage } from '@/components/ui/smart-image'
import { useImageUpload } from '@/features/seller/lib/use-image-upload'
import { formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { useDelivered } from '../queries'

interface DeliverModalProps {
    open: boolean
    orderId: Uuid
    codAmount: number
    onClose: () => void
}

/** Proof-of-delivery: capture a photo with the rear camera, upload it, then confirm delivery. */
export function DeliverModal({ open, orderId, codAmount, onClose }: DeliverModalProps) {
    const { t } = useTranslation()
    const delivered = useDelivered()
    const { upload, isUploading } = useImageUpload()
    const [proofUrl, setProofUrl] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) setProofUrl(null)
    }, [open])

    const handleFile = async (files: FileList | null) => {
        const file = files?.[0]
        if (!file) return
        const [url] = await upload([file])
        if (url) setProofUrl(url)
        if (inputRef.current) inputRef.current.value = ''
    }

    const confirm = () => {
        if (!proofUrl) return
        delivered.mutate(
            { id: orderId, proofImageUrl: proofUrl },
            {
                onSuccess: () => {
                    notify.success(t('shipper.detail.deliveredDone'))
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('shipper.deliver.title')}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('seller.common.cancel')}
                    </Button>
                    <Button
                        icon={<CheckCircle2 />}
                        disabled={!proofUrl || isUploading}
                        loading={delivered.isPending}
                        onClick={confirm}
                    >
                        {t('shipper.deliver.confirm')}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                {codAmount > 0 && (
                    <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                        {t('shipper.deliver.collect', { amount: formatPrice(codAmount) })}
                    </p>
                )}
                <p className="text-sm text-gray-700">{t('shipper.deliver.proofHint')}</p>

                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                    {isUploading ? (
                        <Loader2 className="size-6 animate-spin text-brand-500" aria-label={t('seller.common.loading')} />
                    ) : proofUrl ? (
                        <SmartImage src={proofUrl} alt={t('shipper.deliver.proofAlt')} className="size-full object-contain" />
                    ) : (
                        <span className="text-sm text-gray-400">{t('shipper.deliver.noPhoto')}</span>
                    )}
                </div>

                <Button block variant="soft" icon={<Camera />} disabled={isUploading} onClick={() => inputRef.current?.click()}>
                    {proofUrl ? t('shipper.deliver.retake') : t('shipper.deliver.take')}
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={event => void handleFile(event.target.files)}
                />
            </div>
        </Modal>
    )
}
