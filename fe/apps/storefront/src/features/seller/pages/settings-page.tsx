import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { ImageUploader } from '@/components/common/image-uploader'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { Field, Input, Textarea } from '@/components/ui/form-controls'
import { notify } from '@/lib/notify'
import { PROVINCES } from '../lib/provinces'
import { SellerShell } from '../components/seller-shell'
import { useSellerStore, useUpdateStore } from '../queries'
import type { SellerStore } from '../types'

const buildSchema = (t: TFunction) =>
    z.object({
        name: z.string().trim().min(2, t('seller.validation.storeNameMin')).max(100, t('seller.validation.nameMax')),
        description: z.string().max(1000, t('seller.validation.storeDescriptionMax')),
        phone: z.string().trim().regex(/^(0|\+84)\d{9,10}$/, t('seller.validation.phone')),
        address: z.string().trim().min(5, t('seller.validation.addressRequired')).max(255),
        province: z.string().trim().min(1, t('seller.validation.provinceRequired')),
        logoUrl: z.string(),
        bannerUrl: z.string(),
    })

type StoreFormValues = z.infer<ReturnType<typeof buildSchema>>

const toForm = (store: SellerStore): StoreFormValues => ({
    name: store.name,
    description: store.description ?? '',
    phone: store.phone ?? '',
    address: store.address ?? '',
    province: store.province ?? '',
    logoUrl: store.logoUrl ?? '',
    bannerUrl: store.bannerUrl ?? '',
})

const PROVINCE_LIST_ID = 'seller-province-options'

function StoreForm({ store }: { store: SellerStore }) {
    const { t } = useTranslation()
    const update = useUpdateStore()
    const schema = useMemo(() => buildSchema(t), [t])
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<StoreFormValues>({ resolver: zodResolver(schema), defaultValues: toForm(store), mode: 'onTouched' })

    const onSubmit = handleSubmit(values => {
        update.mutate(
            { ...values, name: values.name.trim(), phone: values.phone.trim(), address: values.address.trim(), province: values.province.trim() },
            {
                onSuccess: () => {
                    notify.success(t('seller.settings.saved'))
                    reset(values)
                },
            },
        )
    })

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
            {store.status && store.status !== 'ACTIVE' && (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {t(`seller.settings.storeStatus.${store.status}`)}
                    {store.rejectReason && ` ${t('seller.settings.reason', { reason: store.rejectReason })}`}
                </div>
            )}
            <section className="space-y-3 rounded-xl border bg-white p-4">
                <h2 className="text-base font-semibold text-gray-800">{t('seller.settings.info')}</h2>
                <Field label={t('seller.settings.name')} required error={errors.name?.message}>
                    <Input maxLength={100} invalid={Boolean(errors.name)} {...register('name')} />
                </Field>
                <Field label={t('seller.settings.description')} error={errors.description?.message}>
                    <Textarea rows={4} maxLength={1000} invalid={Boolean(errors.description)} {...register('description')} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t('seller.settings.phone')} required error={errors.phone?.message}>
                        <Input type="tel" inputMode="tel" invalid={Boolean(errors.phone)} {...register('phone')} />
                    </Field>
                    <Field label={t('seller.settings.province')} required error={errors.province?.message}>
                        <Input list={PROVINCE_LIST_ID} invalid={Boolean(errors.province)} {...register('province')} />
                        <datalist id={PROVINCE_LIST_ID}>
                            {PROVINCES.map(province => (
                                <option key={province} value={province} />
                            ))}
                        </datalist>
                    </Field>
                </div>
                <Field
                    label={t('seller.settings.address')}
                    hint={t('seller.settings.addressHint')}
                    required
                    error={errors.address?.message}
                >
                    <Input maxLength={255} invalid={Boolean(errors.address)} {...register('address')} />
                </Field>
            </section>

            <section className="space-y-4 rounded-xl border bg-white p-4">
                <h2 className="text-base font-semibold text-gray-800">{t('seller.settings.branding')}</h2>
                <Controller
                    control={control}
                    name="logoUrl"
                    render={({ field }) => (
                        <ImageUploader
                            max={1}
                            label={t('seller.settings.logo')}
                            value={field.value ? [field.value] : []}
                            onChange={urls => field.onChange(urls[0] ?? '')}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="bannerUrl"
                    render={({ field }) => (
                        <ImageUploader
                            max={1}
                            label={t('seller.settings.banner')}
                            value={field.value ? [field.value] : []}
                            onChange={urls => field.onChange(urls[0] ?? '')}
                        />
                    )}
                />
            </section>

            <div className="flex justify-end">
                <Button type="submit" icon={<Save />} loading={update.isPending} disabled={!isDirty}>
                    {t('seller.common.save')}
                </Button>
            </div>
        </form>
    )
}

export function SettingsPage() {
    const { t } = useTranslation()
    const query = useSellerStore()
    return (
        <SellerShell title={t('seller.settings.title')}>
            {query.isLoading && <Skeleton className="h-96 w-full rounded-xl" />}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && <StoreForm key={query.data.id} store={query.data} />}
        </SellerShell>
    )
}
