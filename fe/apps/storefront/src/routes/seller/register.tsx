import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { RegistrationStatusCard } from '@/components/auth/registration-status-card'
import { ImageUploader } from '@/components/common/image-uploader'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/form-controls'
import { useRegisterStore } from '@/features/account/queries'
import { useProfile } from '@/hooks/use-profile'
import { notify } from '@/lib/notify'

export const Route = createFileRoute('/seller/register')({ component: SellerRegisterPage })

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/

const buildSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().trim().min(3, t('validation.storeName')),
        description: z.string().trim().min(10, t('validation.storeDescription')),
        phone: z.string().trim().regex(PHONE_REGEX, t('validation.phone')),
        address: z.string().trim().min(5, t('validation.required')),
        province: z.string().trim().min(1, t('validation.required')),
        logoUrl: z.string(),
    })

type StoreForm = z.infer<ReturnType<typeof buildSchema>>

function SellerRegisterPage() {
    const { t } = useTranslation()
    const { storeStatus } = useProfile()
    const register = useRegisterStore()
    const {
        register: field,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<StoreForm>({
        resolver: zodResolver(buildSchema(t)),
        defaultValues: { name: '', description: '', phone: '', address: '', province: '', logoUrl: '' },
    })

    if (storeStatus) {
        return (
            <div className="container-page py-8">
                <RegistrationStatusCard role="seller" status={storeStatus} />
            </div>
        )
    }

    return (
        <div className="container-page py-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('registration.seller.formTitle')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('registration.seller.formSubtitle')}</p>
                <form
                    noValidate
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                    onSubmit={handleSubmit(values =>
                        register.mutate(values, { onSuccess: () => notify.success(t('registration.submitted')) }),
                    )}
                >
                    <Field label={t('registration.seller.name')} error={errors.name?.message} required className="sm:col-span-2">
                        <Input {...field('name')} invalid={!!errors.name} />
                    </Field>
                    <Field
                        label={t('registration.seller.description')}
                        error={errors.description?.message}
                        required
                        className="sm:col-span-2"
                    >
                        <Textarea rows={3} {...field('description')} invalid={!!errors.description} />
                    </Field>
                    <Field label={t('registration.seller.phone')} error={errors.phone?.message} required>
                        <Input type="tel" {...field('phone')} invalid={!!errors.phone} />
                    </Field>
                    <Field label={t('registration.seller.province')} error={errors.province?.message} required>
                        <Input {...field('province')} invalid={!!errors.province} />
                    </Field>
                    <Field label={t('registration.seller.address')} error={errors.address?.message} required className="sm:col-span-2">
                        <Input {...field('address')} invalid={!!errors.address} />
                    </Field>
                    <div className="sm:col-span-2">
                        <Controller
                            control={control}
                            name="logoUrl"
                            render={({ field: logo }) => (
                                <ImageUploader
                                    max={1}
                                    label={t('registration.seller.logo')}
                                    value={logo.value ? [logo.value] : []}
                                    onChange={urls => logo.onChange(urls[0] ?? '')}
                                />
                            )}
                        />
                    </div>
                    <Button type="submit" size="lg" loading={register.isPending} className="sm:col-span-2">
                        {t('registration.submit')}
                    </Button>
                </form>
            </div>
        </div>
    )
}
