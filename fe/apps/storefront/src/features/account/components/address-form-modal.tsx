import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'
import { useSaveAddress } from '@/features/account/queries'
import { notify } from '@/lib/notify'
import type { AddressResponse } from '@/types/shop'

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/

const buildSchema = (t: (key: string) => string) =>
    z.object({
        receiverName: z.string().trim().min(2, t('validation.receiverName')),
        phone: z.string().trim().regex(PHONE_REGEX, t('validation.phone')),
        province: z.string().trim().min(1, t('validation.required')),
        district: z.string().trim().min(1, t('validation.required')),
        ward: z.string().trim().min(1, t('validation.required')),
        detail: z.string().trim().min(3, t('validation.required')),
        isDefault: z.boolean(),
    })

type AddressForm = z.infer<ReturnType<typeof buildSchema>>

const EMPTY: AddressForm = {
    receiverName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detail: '',
    isDefault: false,
}

interface AddressFormModalProps {
    open: boolean
    onClose: () => void
    /** Present when editing an existing address */
    address?: AddressResponse | null
}

export function AddressFormModal({ open, onClose, address }: AddressFormModalProps) {
    const { t } = useTranslation()
    const save = useSaveAddress()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AddressForm>({ resolver: zodResolver(buildSchema(t)), defaultValues: EMPTY })

    useEffect(() => {
        if (open) reset(address ? { ...EMPTY, ...address } : EMPTY)
    }, [open, address, reset])

    const submit = handleSubmit(values =>
        save.mutate(
            { ...values, id: address?.id },
            {
                onSuccess: () => {
                    notify.success(t('address.saved'))
                    onClose()
                },
            },
        ),
    )

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={address ? t('address.edit') : t('address.add')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button loading={save.isPending} onClick={() => void submit()}>
                        {t('common.save')}
                    </Button>
                </>
            }
        >
            <form noValidate onSubmit={event => void submit(event)} className="grid gap-3 sm:grid-cols-2">
                <Field label={t('address.receiverName')} error={errors.receiverName?.message} required>
                    <Input {...register('receiverName')} autoComplete="name" invalid={!!errors.receiverName} />
                </Field>
                <Field label={t('address.phone')} error={errors.phone?.message} required>
                    <Input {...register('phone')} type="tel" autoComplete="tel" invalid={!!errors.phone} />
                </Field>
                <Field label={t('address.province')} error={errors.province?.message} required>
                    <Input {...register('province')} invalid={!!errors.province} />
                </Field>
                <Field label={t('address.district')} error={errors.district?.message} required>
                    <Input {...register('district')} invalid={!!errors.district} />
                </Field>
                <Field label={t('address.ward')} error={errors.ward?.message} required className="sm:col-span-2">
                    <Input {...register('ward')} invalid={!!errors.ward} />
                </Field>
                <Field label={t('address.detail')} error={errors.detail?.message} required className="sm:col-span-2">
                    <Input {...register('detail')} invalid={!!errors.detail} />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" className="size-4 accent-brand-500" {...register('isDefault')} />
                    {t('address.setDefault')}
                </label>
                <button type="submit" hidden />
            </form>
        </Modal>
    )
}

export const formatAddress = (a: Pick<AddressResponse, 'detail' | 'ward' | 'district' | 'province'>): string =>
    [a.detail, a.ward, a.district, a.province].filter(Boolean).join(', ')
