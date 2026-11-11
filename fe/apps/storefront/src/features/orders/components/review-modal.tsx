import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUploader } from '@/components/common/image-uploader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { RatingInput } from '@/components/ui/rating-stars'
import { SmartImage } from '@/components/ui/smart-image'
import { useCreateReview } from '@/features/orders/queries'
import { notify } from '@/lib/notify'
import type { OrderItemResponse } from '@/types/shop'

interface ReviewModalProps {
    item: OrderItemResponse | null
    onClose: () => void
}

export function ReviewModal({ item, onClose }: ReviewModalProps) {
    const { t } = useTranslation()
    const create = useCreateReview()
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [images, setImages] = useState<string[]>([])

    useEffect(() => {
        if (item) {
            setRating(5)
            setComment('')
            setImages([])
        }
    }, [item])

    const submit = () => {
        if (!item) return
        create.mutate(
            { orderItemId: item.id, rating, comment: comment.trim(), imageUrls: images },
            {
                onSuccess: () => {
                    notify.success(t('review.thanks'))
                    onClose()
                },
            },
        )
    }

    return (
        <Modal
            open={item !== null}
            onClose={onClose}
            title={t('review.writeTitle')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button loading={create.isPending} onClick={submit}>
                        {t('review.submit')}
                    </Button>
                </>
            }
        >
            {item && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <SmartImage src={item.imageUrl} alt={item.productName} className="size-14 rounded-md border object-cover" />
                        <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium">{item.productName}</p>
                            {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                        </div>
                    </div>
                    <div>
                        <p className="mb-1 text-sm font-medium text-gray-700">{t('review.yourRating')}</p>
                        <RatingInput value={rating} onChange={setRating} label={t('review.yourRating')} />
                    </div>
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">{t('review.comment')}</span>
                        <Textarea
                            rows={4}
                            maxLength={1000}
                            value={comment}
                            onChange={event => setComment(event.target.value)}
                            placeholder={t('review.commentPlaceholder')}
                        />
                    </label>
                    <ImageUploader value={images} onChange={setImages} max={5} label={t('review.addPhotos')} />
                </div>
            )}
        </Modal>
    )
}
