import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ImageUploader } from '@/components/common/image-uploader'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import { MAX_RETURN_IMAGES, RETURN_REASON_CODES, type OrderDetailResponse } from '@/types/shop'
import { useRequestReturn } from '../queries'
import { buildReturnSchema, emptyReturnForm, formToReturnRequest, type ReturnFormValues } from '../lib/return-schema'

interface ReturnRequestModalProps {
    open: boolean
    order: Pick<OrderDetailResponse, 'id' | 'code' | 'total'>
    onClose: () => void
}

/** Buyer return/refund request: reason, evidence photos and the bank account to refund to (contract §12.3). */
export function ReturnRequestModal({ open, order, onClose }: ReturnRequestModalProps) {
    const { t } = useTranslation()
    const request = useRequestReturn()
    const schema = useMemo(() => buildReturnSchema(t), [t])
    const [pending, setPending] = useState<ReturnFormValues | null>(null)
    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<ReturnFormValues>({
        resolver: zodResolver(schema),
        defaultValues: emptyReturnForm(),
        mode: 'onTouched',
    })
    const reasonCode = watch('reasonCode')

    useEffect(() => {
        if (open) {
            reset(emptyReturnForm())
            setPending(null)
        }
    }, [open, reset])

    const submit = () => {
        if (!pending) return
        request.mutate(formToReturnRequest(order.id, pending), {
            onSuccess: () => {
                notify.success(t('order.return.submitted'))
                setPending(null)
                onClose()
            },
            onError: () => setPending(null),
        })
    }

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                size="lg"
                title={t('order.return.requestTitle')}
                footer={
                    <>
                        <Button variant="outline" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" form="return-request-form">
                            {t('order.return.submit')}
                        </Button>
                    </>
                }
            >
                <form
                    id="return-request-form"
                    noValidate
                    onSubmit={event => void handleSubmit(values => setPending(values))(event)}
                    className="space-y-4"
                >
                    <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                        {t('order.return.requestIntro', { code: order.code, amount: formatPrice(order.total) })}
                    </p>

                    <Field label={t('order.return.reasonLabel')} error={errors.reasonCode?.message} required>
                        <Select {...register('reasonCode')} invalid={!!errors.reasonCode}>
                            {RETURN_REASON_CODES.map(code => (
                                <option key={code} value={code}>
                                    {t(`order.return.reason.${code}`)}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field
                        label={t('order.return.descriptionLabel')}
                        error={errors.description?.message}
                        required={reasonCode === 'OTHER'}
                    >
                        <Textarea
                            rows={3}
                            maxLength={1000}
                            placeholder={t('order.return.descriptionPlaceholder')}
                            invalid={!!errors.description}
                            {...register('description')}
                        />
                    </Field>

                    <div className="space-y-1">
                        <Controller
                            control={control}
                            name="imageUrls"
                            render={({ field }) => (
                                <ImageUploader
                                    value={field.value}
                                    onChange={field.onChange}
                                    max={MAX_RETURN_IMAGES}
                                    label={`${t('order.return.photosLabel')} *`}
                                />
                            )}
                        />
                        {errors.imageUrls && (
                            <p role="alert" className="text-xs text-red-600">
                                {errors.imageUrls.message}
                            </p>
                        )}
                    </div>

                    <fieldset className="space-y-3 rounded-lg border p-3">
                        <legend className="px-1 text-sm font-semibold text-gray-800">
                            {t('order.return.bankSection')}
                        </legend>
                        <p className="text-xs text-gray-500">{t('order.return.bankHint')}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label={t('order.return.bankName')} error={errors.bankName?.message} required>
                                <Input
                                    placeholder={t('order.return.bankNamePlaceholder')}
                                    invalid={!!errors.bankName}
                                    {...register('bankName')}
                                />
                            </Field>
                            <Field label={t('order.return.accountNo')} error={errors.bankAccountNo?.message} required>
                                <Input
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={30}
                                    invalid={!!errors.bankAccountNo}
                                    {...register('bankAccountNo')}
                                />
                            </Field>
                            <Field
                                label={t('order.return.accountName')}
                                error={errors.bankAccountName?.message}
                                required
                                className="sm:col-span-2"
                            >
                                <Input
                                    autoComplete="off"
                                    placeholder={t('order.return.accountNamePlaceholder')}
                                    invalid={!!errors.bankAccountName}
                                    {...register('bankAccountName')}
                                />
                            </Field>
                        </div>
                    </fieldset>
                </form>
            </Modal>

            <Modal
                open={pending !== null}
                onClose={() => setPending(null)}
                size="sm"
                title={t('order.return.confirmTitle')}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setPending(null)}>
                            {t('common.back')}
                        </Button>
                        <Button loading={request.isPending} onClick={submit}>
                            {t('order.return.confirmSend')}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-700">
                    {t('order.return.confirmMessage', { code: order.code, amount: formatPrice(order.total) })}
                </p>
                {pending && (
                    <dl className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">{t('order.return.bankName')}</dt>
                            <dd className="font-medium">{pending.bankName}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">{t('order.return.accountNo')}</dt>
                            <dd className="font-mono font-medium">{pending.bankAccountNo}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">{t('order.return.accountName')}</dt>
                            <dd className="font-medium">{pending.bankAccountName.toUpperCase()}</dd>
                        </div>
                    </dl>
                )}
            </Modal>
        </>
    )
}
