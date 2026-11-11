import { useEffect } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/form-controls'
import { registerAccount } from '@/features/catalog/api'
import { notify } from '@/lib/notify'
import { useAuth } from '@/providers/auth-provider'

export const Route = createFileRoute('/register')({ component: RegisterPage })

const PHONE_REGEX = /^(0|\+84)\d{9,10}$/

const buildSchema = (t: (key: string) => string) =>
    z
        .object({
            fullName: z.string().trim().min(2, t('validation.fullName')),
            username: z
                .string()
                .trim()
                .min(4, t('validation.usernameMin'))
                .regex(/^[a-zA-Z0-9._-]+$/, t('validation.usernameFormat')),
            email: z.string().trim().email(t('validation.email')),
            phone: z.string().trim().regex(PHONE_REGEX, t('validation.phone')),
            password: z.string().min(8, t('validation.passwordMin')),
            confirmPassword: z.string(),
        })
        .refine(values => values.password === values.confirmPassword, {
            path: ['confirmPassword'],
            message: t('validation.passwordMismatch'),
        })

type RegisterForm = z.infer<ReturnType<typeof buildSchema>>

function RegisterPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const { isAuthenticated, login } = useAuth()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({ resolver: zodResolver(buildSchema(t)), mode: 'onBlur' })

    useEffect(() => {
        if (isAuthenticated) router.history.replace('/')
    }, [isAuthenticated, router])

    const mutation = useMutation({
        mutationFn: ({ confirmPassword: _confirm, ...request }: RegisterForm) => registerAccount(request),
        onSuccess: () => {
            notify.success(t('auth.registerSuccess'))
            login('/')
        },
    })

    return (
        <div className="container-page py-8">
            <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-sm sm:p-8">
                <h1 className="text-2xl font-bold text-gray-900">{t('auth.registerTitle')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('auth.registerSubtitle')}</p>

                <form
                    noValidate
                    onSubmit={handleSubmit(values => mutation.mutate(values))}
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                >
                    <Field label={t('auth.fullName')} error={errors.fullName?.message} required className="sm:col-span-2">
                        <Input {...register('fullName')} autoComplete="name" invalid={!!errors.fullName} />
                    </Field>
                    <Field label={t('auth.username')} error={errors.username?.message} required>
                        <Input {...register('username')} autoComplete="username" invalid={!!errors.username} />
                    </Field>
                    <Field label={t('auth.phone')} error={errors.phone?.message} required>
                        <Input {...register('phone')} type="tel" autoComplete="tel" invalid={!!errors.phone} />
                    </Field>
                    <Field label={t('auth.email')} error={errors.email?.message} required className="sm:col-span-2">
                        <Input {...register('email')} type="email" autoComplete="email" invalid={!!errors.email} />
                    </Field>
                    <Field label={t('auth.password')} error={errors.password?.message} required>
                        <Input
                            {...register('password')}
                            type="password"
                            autoComplete="new-password"
                            invalid={!!errors.password}
                        />
                    </Field>
                    <Field label={t('auth.confirmPassword')} error={errors.confirmPassword?.message} required>
                        <Input
                            {...register('confirmPassword')}
                            type="password"
                            autoComplete="new-password"
                            invalid={!!errors.confirmPassword}
                        />
                    </Field>
                    <Button type="submit" size="lg" loading={mutation.isPending} className="sm:col-span-2">
                        {t('auth.registerSubmit')}
                    </Button>
                </form>

                <p className="mt-5 text-center text-sm text-gray-600">
                    {t('auth.haveAccount')}{' '}
                    <button type="button" onClick={() => login('/')} className="font-semibold text-brand-600 hover:underline">
                        {t('header.login')}
                    </button>
                </p>
                <p className="mt-2 text-center text-xs text-gray-400">
                    <Link to="/" className="hover:underline">
                        {t('common.backHome')}
                    </Link>
                </p>
            </div>
        </div>
    )
}
