import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { RegistrationStatusCard } from '@/components/auth/registration-status-card'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form-controls'
import { useRegisterShipper } from '@/features/account/queries'
import { useProfile } from '@/hooks/use-profile'
import { notify } from '@/lib/notify'

export const Route = createFileRoute('/shipper/register')({ component: ShipperRegisterPage })

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/
const VEHICLE_TYPES = ['MOTORBIKE', 'BICYCLE', 'CAR', 'VAN'] as const

const buildSchema = (t: (key: string) => string) =>
    z.object({
        fullName: z.string().trim().min(2, t('validation.fullName')),
        phone: z.string().trim().regex(PHONE_REGEX, t('validation.phone')),
        idNumber: z.string().trim().regex(/^\d{9}$|^\d{12}$/, t('validation.idNumber')),
        vehicleType: z.enum(VEHICLE_TYPES),
        vehiclePlate: z.string().trim().min(4, t('validation.required')),
        areaProvince: z.string().trim().min(1, t('validation.required')),
    })

type ShipperForm = z.infer<ReturnType<typeof buildSchema>>

function ShipperRegisterPage() {
    const { t } = useTranslation()
    const { shipperStatus } = useProfile()
    const register = useRegisterShipper()
    const {
        register: field,
        handleSubmit,
        formState: { errors },
    } = useForm<ShipperForm>({
        resolver: zodResolver(buildSchema(t)),
        defaultValues: { fullName: '', phone: '', idNumber: '', vehicleType: 'MOTORBIKE', vehiclePlate: '', areaProvince: '' },
    })

    if (shipperStatus) {
        return (
            <div className="container-page py-8">
                <RegistrationStatusCard role="shipper" status={shipperStatus} />
            </div>
        )
    }

    return (
        <div className="container-page py-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('registration.shipper.formTitle')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('registration.shipper.formSubtitle')}</p>
                <form
                    noValidate
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                    onSubmit={handleSubmit(values =>
                        register.mutate(values, { onSuccess: () => notify.success(t('registration.submitted')) }),
                    )}
                >
                    <Field label={t('registration.shipper.fullName')} error={errors.fullName?.message} required>
                        <Input {...field('fullName')} autoComplete="name" invalid={!!errors.fullName} />
                    </Field>
                    <Field label={t('registration.shipper.phone')} error={errors.phone?.message} required>
                        <Input type="tel" {...field('phone')} invalid={!!errors.phone} />
                    </Field>
                    <Field label={t('registration.shipper.idNumber')} error={errors.idNumber?.message} required>
                        <Input inputMode="numeric" {...field('idNumber')} invalid={!!errors.idNumber} />
                    </Field>
                    <Field label={t('registration.shipper.areaProvince')} error={errors.areaProvince?.message} required>
                        <Input {...field('areaProvince')} invalid={!!errors.areaProvince} />
                    </Field>
                    <Field label={t('registration.shipper.vehicleType')} error={errors.vehicleType?.message} required>
                        <Select {...field('vehicleType')}>
                            {VEHICLE_TYPES.map(type => (
                                <option key={type} value={type}>
                                    {t(`registration.shipper.vehicles.${type}`)}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label={t('registration.shipper.vehiclePlate')} error={errors.vehiclePlate?.message} required>
                        <Input {...field('vehiclePlate')} invalid={!!errors.vehiclePlate} />
                    </Field>
                    <Button type="submit" size="lg" loading={register.isPending} className="sm:col-span-2">
                        {t('registration.submit')}
                    </Button>
                </form>
            </div>
        </div>
    )
}
