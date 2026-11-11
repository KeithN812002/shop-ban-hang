import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { notify } from '@/lib/notify'
import { toNullableNumber, toNumber } from '../lib/form-helpers'
import {
    buildVoucherSchema,
    emptyVoucherForm,
    formToVoucherRequest,
    voucherToForm,
    type VoucherFormValues,
} from '../lib/voucher-schema'
import { useSaveVoucher } from '../queries'
import type { SellerVoucher } from '../types'

const FORM_ID = 'seller-voucher-form'

interface VoucherModalProps {
    open: boolean
    /** Voucher being edited; null = create. */
    voucher: SellerVoucher | null
    onClose: () => void
}

export function VoucherModal({ open, voucher, onClose }: VoucherModalProps) {
    const { t } = useTranslation()
    const save = useSaveVoucher()
    const schema = useMemo(() => buildVoucherSchema(t), [t])
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<VoucherFormValues>({
        resolver: zodResolver(schema),
        defaultValues: emptyVoucherForm(),
        mode: 'onTouched',
    })
    const discountType = watch('discountType')

    useEffect(() => {
        if (open) reset(voucher ? voucherToForm(voucher) : emptyVoucherForm())
    }, [open, voucher, reset])

    const onSubmit = handleSubmit(values => {
        save.mutate(formToVoucherRequest(values, voucher?.id), {
            onSuccess: () => {
                notify.success(t(voucher ? 'seller.vouchers.updated' : 'seller.vouchers.created'))
                onClose()
            },
        })
    })

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            title={t(voucher ? 'seller.vouchers.editTitle' : 'seller.vouchers.newTitle')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('seller.common.cancel')}
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={save.isPending}>
                        {t('seller.common.save')}
                    </Button>
                </>
            }
        >
            <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid gap-3 sm:grid-cols-2">
                <Field label={t('seller.vouchers.code')} required error={errors.code?.message} hint={t('seller.vouchers.codeHint')}>
                    <Input className="uppercase" invalid={Boolean(errors.code)} {...register('code')} />
                </Field>
                <Field label={t('seller.vouchers.name')} required error={errors.name?.message}>
                    <Input invalid={Boolean(errors.name)} {...register('name')} />
                </Field>

                <Field label={t('seller.vouchers.type')}>
                    <Select {...register('discountType')}>
                        <option value="PERCENT">{t('seller.vouchers.types.PERCENT')}</option>
                        <option value="FIXED">{t('seller.vouchers.types.FIXED')}</option>
                    </Select>
                </Field>
                <Field
                    label={t(discountType === 'PERCENT' ? 'seller.vouchers.valuePercent' : 'seller.vouchers.valueFixed')}
                    required
                    error={errors.discountValue?.message}
                >
                    <Input
                        type="number"
                        min={1}
                        max={discountType === 'PERCENT' ? 100 : undefined}
                        step={1}
                        inputMode="numeric"
                        invalid={Boolean(errors.discountValue)}
                        {...register('discountValue', { setValueAs: toNumber })}
                    />
                </Field>

                {discountType === 'PERCENT' && (
                    <Field
                        label={t('seller.vouchers.maxDiscount')}
                        hint={t('seller.vouchers.maxDiscountHint')}
                        error={errors.maxDiscount?.message}
                    >
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            invalid={Boolean(errors.maxDiscount)}
                            {...register('maxDiscount', { setValueAs: toNullableNumber })}
                        />
                    </Field>
                )}
                <Field label={t('seller.vouchers.minOrder')} error={errors.minOrderValue?.message}>
                    <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        invalid={Boolean(errors.minOrderValue)}
                        {...register('minOrderValue', { setValueAs: toNullableNumber })}
                    />
                </Field>

                <Field label={t('seller.vouchers.startAt')} required error={errors.startAt?.message}>
                    <Input type="datetime-local" invalid={Boolean(errors.startAt)} {...register('startAt')} />
                </Field>
                <Field label={t('seller.vouchers.endAt')} required error={errors.endAt?.message}>
                    <Input type="datetime-local" invalid={Boolean(errors.endAt)} {...register('endAt')} />
                </Field>

                <Field
                    label={t('seller.vouchers.usageLimit')}
                    hint={t('seller.vouchers.unlimitedHint')}
                    error={errors.usageLimit?.message}
                >
                    <Input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        invalid={Boolean(errors.usageLimit)}
                        {...register('usageLimit', { setValueAs: toNullableNumber })}
                    />
                </Field>
                <Field
                    label={t('seller.vouchers.perUserLimit')}
                    hint={t('seller.vouchers.unlimitedHint')}
                    error={errors.perUserLimit?.message}
                >
                    <Input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        invalid={Boolean(errors.perUserLimit)}
                        {...register('perUserLimit', { setValueAs: toNullableNumber })}
                    />
                </Field>

                <Field label={t('seller.vouchers.status')}>
                    <Select {...register('status')}>
                        <option value="ACTIVE">{t('seller.vouchers.statuses.ACTIVE')}</option>
                        <option value="INACTIVE">{t('seller.vouchers.statuses.INACTIVE')}</option>
                    </Select>
                </Field>
            </form>
        </Modal>
    )
}
