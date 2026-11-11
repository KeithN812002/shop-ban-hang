import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ErrorState, Spinner } from '@/components/ui/feedback'
import { Field, Input } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { notify } from '@/lib/notify'
import { toNumber } from '../lib/form-helpers'
import {
    buildPromotionSchema,
    emptyPromotionForm,
    formToPromotionRequest,
    promotionToForm,
    type PromotionFormValues,
} from '../lib/promotion-schema'
import { useSavePromotion, useSellerPromotion } from '../queries'
import { MAX_PROMOTION_PERCENT, MIN_PROMOTION_PERCENT, type PromotionProduct, type SellerPromotion } from '../types'
import { PromotionProductPicker } from './promotion-product-picker'

const FORM_ID = 'seller-promotion-form'

interface PromotionModalProps {
    open: boolean
    /** Promotion being edited (list row); null = create. The product list is loaded from the detail endpoint. */
    promotion: SellerPromotion | null
    onClose: () => void
}

export function PromotionModal({ open, promotion, onClose }: PromotionModalProps) {
    const { t } = useTranslation()
    const save = useSavePromotion()
    const detail = useSellerPromotion(open ? promotion?.id : undefined)
    const schema = useMemo(() => buildPromotionSchema(t), [t])
    const [selected, setSelected] = useState<PromotionProduct[]>([])
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PromotionFormValues>({
        resolver: zodResolver(schema),
        defaultValues: emptyPromotionForm(),
        mode: 'onTouched',
    })
    const status = watch('status')
    const percent = watch('discountPercent')

    useEffect(() => {
        if (!open) return
        if (!promotion) {
            reset(emptyPromotionForm())
            setSelected([])
        } else if (detail.data) {
            reset(promotionToForm(detail.data))
            setSelected(detail.data.products ?? [])
        }
    }, [open, promotion, detail.data, reset])

    const changeProducts = (next: PromotionProduct[]) => {
        setSelected(next)
        setValue(
            'productIds',
            next.map(product => product.id),
            { shouldValidate: true, shouldDirty: true },
        )
    }

    const onSubmit = handleSubmit(values => {
        save.mutate(formToPromotionRequest(values, promotion?.id), {
            onSuccess: () => {
                notify.success(t(promotion ? 'seller.promotions.updated' : 'seller.promotions.created'))
                onClose()
            },
        })
    })

    const editing = promotion !== null
    const loadingDetail = editing && detail.isLoading
    const ready = !editing || Boolean(detail.data)

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={t(editing ? 'seller.promotions.editTitle' : 'seller.promotions.newTitle')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('seller.common.cancel')}
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={save.isPending} disabled={!ready}>
                        {t('seller.common.save')}
                    </Button>
                </>
            }
        >
            {loadingDetail && (
                <div className="flex justify-center p-6">
                    <Spinner />
                </div>
            )}
            {editing && detail.isError && <ErrorState onRetry={() => void detail.refetch()} />}
            {ready && (
                <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
                    <Field label={t('seller.promotions.name')} required error={errors.name?.message} className="sm:col-span-2">
                        <Input maxLength={150} invalid={Boolean(errors.name)} {...register('name')} />
                    </Field>

                    <Field
                        label={t('seller.promotions.discountPercent')}
                        required
                        hint={t('seller.promotions.discountHint', { min: MIN_PROMOTION_PERCENT, max: MAX_PROMOTION_PERCENT })}
                        error={errors.discountPercent?.message}
                    >
                        <Input
                            type="number"
                            min={MIN_PROMOTION_PERCENT}
                            max={MAX_PROMOTION_PERCENT}
                            step={1}
                            inputMode="numeric"
                            invalid={Boolean(errors.discountPercent)}
                            {...register('discountPercent', { setValueAs: toNumber })}
                        />
                    </Field>
                    <div className="flex items-end pb-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                role="switch"
                                className="size-4 accent-brand-500"
                                checked={status === 'ACTIVE'}
                                onChange={event => setValue('status', event.target.checked ? 'ACTIVE' : 'INACTIVE', { shouldDirty: true })}
                            />
                            {t(status === 'ACTIVE' ? 'seller.promotions.statusOn' : 'seller.promotions.statusOff')}
                        </label>
                    </div>

                    <Field label={t('seller.promotions.startAt')} required error={errors.startAt?.message}>
                        <Input type="datetime-local" invalid={Boolean(errors.startAt)} {...register('startAt')} />
                    </Field>
                    <Field label={t('seller.promotions.endAt')} required error={errors.endAt?.message}>
                        <Input type="datetime-local" invalid={Boolean(errors.endAt)} {...register('endAt')} />
                    </Field>

                    <PromotionProductPicker
                        selected={selected}
                        onChange={changeProducts}
                        percent={percent}
                        error={errors.productIds?.message}
                    />
                </form>
            )}
        </Modal>
    )
}
