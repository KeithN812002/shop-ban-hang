'use client'

import { BsInput } from '@workspace/ui/components/Textfield'
import { Button } from '@workspace/ui/components/Button'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, memo, useRef, useState } from 'react'
import { FormProvider, type FieldErrors, useForm, Controller } from 'react-hook-form'
import type { ConfirmChangePasswordRequest } from '@/services/auth'
import {
    useConfirmChangePassword,
    usePasswordPolicy,
    useRequestChangePasswordOtp,
    useResendChangePasswordOtp,
    useFetchUserInfo,
} from '@/services/auth'
import { triggerForceLogout } from '@/lib/storage'
import { ArrowLeft, Check, Circle, X } from 'lucide-react'

interface ChangePasswordDialogProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
}

interface ChangePasswordDialogFormData {
    oldPassword: string
    newPassword: string
    otp: string
    confirmPassword: string
}

interface PolicyRule {
    key: string
    label: string
    pass: boolean
}

const formatExpiryTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface OtpInputProps {
    value: string
    onChange: (value: string) => void
    isDisabled?: boolean
    hasError?: boolean
}

const OtpInput = ({ value, onChange, isDisabled, hasError }: OtpInputProps) => {
    const inputsRef = useRef<HTMLInputElement[]>([])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value.trim()
        if (val && !/^\d$/.test(val)) return

        const otpArray = value.split('')
        otpArray[index] = val
        const newOtp = otpArray.join('')
        onChange(newOtp)

        if (val && index < 5) {
            inputsRef.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            const otpArray = value.split('')
            if (!otpArray[index] && index > 0) {
                otpArray[index - 1] = ''
                onChange(otpArray.join(''))
                inputsRef.current[index - 1]?.focus()
            } else {
                otpArray[index] = ''
                onChange(otpArray.join(''))
            }
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').trim()
        if (/^\d{6}$/.test(pastedData)) {
            onChange(pastedData)
            inputsRef.current[5]?.focus()
        }
    }

    const otpValues = value.padEnd(6, ' ').split('')
    const isCompleted = value.length === 6

    return (
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otpValues.map((char, index) => {
                const inputClass = `w-10 h-12 text-center text-xl font-bold border rounded font-mono transition-all ${
                    hasError
                        ? 'border-red-500 bg-red-500/10 text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                        : isCompleted
                          ? 'border-green-500 bg-green-500/10 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500'
                          : 'border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground'
                }`

                return (
                    <input
                        key={index}
                        ref={el => {
                            inputsRef.current[index] = el as HTMLInputElement
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={char === ' ' ? '' : char}
                        disabled={isDisabled}
                        onChange={e => handleChange(e, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        className={inputClass}
                    />
                )
            })}
        </div>
    )
}

export const ChangePasswordDialog = memo(({ isOpen, onOpenChange }: ChangePasswordDialogProps) => {
    const { t } = useTranslation()
    const [step, setStep] = useState<'form' | 'otp'>('form')
    const [cooldown, setCooldown] = useState(0)
    const [otpExpiry, setOtpExpiry] = useState(0)
    const [isMaxAttemptsReached, setIsMaxAttemptsReached] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const form = useForm<ChangePasswordDialogFormData>({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            otp: '',
        },
    })

    const { data: userInfo } = useFetchUserInfo()
    const userEmail = userInfo?.email
    const confirmChangePasswordMutation = useConfirmChangePassword()
    const requestOtpMutation = useRequestChangePasswordOtp()
    const resendOtpMutation = useResendChangePasswordOtp()
    const isPending =
        confirmChangePasswordMutation.isPending || requestOtpMutation.isPending || resendOtpMutation.isPending

    // Fetch the realm policy only while the dialog is open.
    const { data: policy, isLoading: isPolicyLoading } = usePasswordPolicy(isOpen)

    const newPassword = form.watch('newPassword') ?? ''
    const oldPassword = form.watch('oldPassword') ?? ''
    const hasStarted = newPassword.length > 0

    // Cooldown timer logic
    useEffect(() => {
        if (cooldown > 0) {
            timerRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000)
        }
        return () => clearTimeout(timerRef.current)
    }, [cooldown])

    // OTP Expiry timer logic
    useEffect(() => {
        if (otpExpiry > 0) {
            expiryTimerRef.current = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000)
        }
        return () => clearTimeout(expiryTimerRef.current)
    }, [otpExpiry])

    // Build the live rule list from the realm password policy (only the rules the realm enforces).
    const rules = useMemo<PolicyRule[]>(() => {
        if (!policy) return []
        const count = (re: RegExp) => newPassword.match(re)?.length ?? 0
        const list: PolicyRule[] = []
        if (policy.minLength)
            list.push({
                key: 'minLength',
                label: t('dashboardLayout.userMenu.changePasswordDialog.rules.minLength', { count: policy.minLength }),
                pass: newPassword.length >= policy.minLength,
            })
        if (policy.minDigits)
            list.push({
                key: 'minDigits',
                label: t('dashboardLayout.userMenu.changePasswordDialog.rules.minDigits', { count: policy.minDigits }),
                pass: count(/\d/g) >= policy.minDigits,
            })
        if (policy.minLowerCase)
            list.push({
                key: 'minLowerCase',
                label: t('dashboardLayout.userMenu.changePasswordDialog.rules.minLowerCase', {
                    count: policy.minLowerCase,
                }),
                pass: count(/[a-z]/g) >= policy.minLowerCase,
            })
        if (policy.minUpperCase)
            list.push({
                key: 'minUpperCase',
                label: t('dashboardLayout.userMenu.changePasswordDialog.rules.minUpperCase', {
                    count: policy.minUpperCase,
                }),
                pass: count(/[A-Z]/g) >= policy.minUpperCase,
            })
        if (policy.minSpecialChars)
            list.push({
                key: 'minSpecialChars',
                label: t('dashboardLayout.userMenu.changePasswordDialog.rules.minSpecialChars', {
                    count: policy.minSpecialChars,
                }),
                // Special char = anything that is not a letter or digit (matches the backend definition).
                pass: count(/[^A-Za-z0-9]/g) >= policy.minSpecialChars,
            })
        // The backend always rejects passwords containing spaces.
        list.push({
            key: 'noSpace',
            label: t('dashboardLayout.userMenu.changePasswordDialog.rules.noSpace'),
            pass: !newPassword.includes(' '),
        })
        list.push({
            key: 'notSameAsOld',
            label: t('dashboardLayout.userMenu.changePasswordDialog.rules.notSameAsOld'),
            pass: !newPassword.trim() || newPassword.trim() !== oldPassword.trim(),
        })
        return list
    }, [policy, newPassword, oldPassword, t])

    useEffect(() => {
        if (!isOpen) return
        setStep('form')
        setCooldown(0)
        setOtpExpiry(0)
        setIsMaxAttemptsReached(false)
        form.reset({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            otp: '',
        })
    }, [isOpen, form])

    const focusFirstErrorField = (errors: FieldErrors<ChangePasswordDialogFormData>) => {
        const firstErrorField = Object.keys(errors)[0] as keyof ChangePasswordDialogFormData | undefined
        if (!firstErrorField) return
        form.setFocus(firstErrorField)
    }

    const onSubmit = form.handleSubmit(
        async values => {
            if (step === 'form') {
                try {
                    const res = await requestOtpMutation.mutateAsync({
                        oldPassword: values.oldPassword.trim(),
                        newPassword: values.newPassword.trim(),
                    })
                    form.setValue('otp', '')
                    form.clearErrors('otp')
                    setIsMaxAttemptsReached(false)
                    setStep('otp')
                    setCooldown(res.cooldownMinutes * 60)
                    setOtpExpiry(res.expireMinutes * 60)
                } catch (error) {
                    // handled by global react-query/axios interceptor
                }
            } else {
                const payload: ConfirmChangePasswordRequest = {
                    otp: values.otp?.trim() ?? '',
                }
                try {
                    await confirmChangePasswordMutation.mutateAsync(payload)
                    // Password changed → force a re-login so the new credentials take effect everywhere.
                    triggerForceLogout('password-changed')
                    onOpenChange(false)
                } catch (error: any) {
                    const errorMsg = error?.response?.data?.message || ''
                    const isMaxAttempts =
                        errorMsg.includes('quá nhiều lần') ||
                        errorMsg.includes('request a new code') ||
                        errorMsg.includes('tooManyFailedAttempts')
                    if (isMaxAttempts) {
                        setIsMaxAttemptsReached(true)
                        form.setError('otp', {
                            type: 'manual',
                            message: 'Anh/chị đã nhập sai mã OTP quá nhiều lần. Vui lòng yêu cầu mã mới.',
                        })
                    } else {
                        form.setError('otp', {
                            type: 'manual',
                            message: 'Mã OTP không chính xác hoặc đã hết hiệu lực',
                        })
                    }
                }
            }
        },
        errors => {
            focusFirstErrorField(errors)
        },
    )

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={() => {
                if (step === 'otp') {
                    setStep('form')
                } else {
                    onOpenChange(false)
                }
            }}
            onSave={onSubmit}
            title={t('dashboardLayout.userMenu.changePasswordDialog.title')}
            columns={1}
            className="max-w-2xl"
            t={t}
            closeLabel={step === 'otp' ? 'Quay lại' : t('common.cancel')}
            closeIcon={step === 'otp' ? ArrowLeft : X}
            isPending={isPending}
            footer={
                <Button
                    type="submit"
                    isDisabled={isPolicyLoading || isPending || (step === 'otp' && otpExpiry === 0)}
                    className="gap-2"
                >
                    <Check className="size-4" />
                    Xác nhận
                </Button>
            }
        >
            <LoadingOverlay isLoading={isPolicyLoading || isPending}>
                <FormProvider {...form}>
                    {step === 'form' ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* LEFT: input fields */}
                            <div className="space-y-3">
                                <BsInput
                                    label={t('dashboardLayout.userMenu.changePasswordDialog.currentPassword')}
                                    type="password"
                                    isRequired
                                    minLength={6}
                                    maxLength={100}
                                    name="oldPassword"
                                />

                                <BsInput
                                    label={t('dashboardLayout.userMenu.changePasswordDialog.newPassword')}
                                    type="password"
                                    isRequired
                                    minLength={6}
                                    maxLength={100}
                                    name="newPassword"
                                    rules={{
                                        deps: ['confirmPassword'],
                                        validate: value => {
                                            if (!policy) return true
                                            const val = String(value ?? '')

                                            if (val.trim() && val.trim() === oldPassword.trim()) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.validation.newPasswordSameAsOld',
                                                )
                                            }

                                            if (policy.minLength && val.length < policy.minLength) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.rules.minLength',
                                                    {
                                                        count: policy.minLength,
                                                    },
                                                )
                                            }

                                            const count = (re: RegExp) => val.match(re)?.length ?? 0

                                            if (policy.minDigits && count(/\d/g) < policy.minDigits) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.rules.minDigits',
                                                    {
                                                        count: policy.minDigits,
                                                    },
                                                )
                                            }

                                            if (policy.minLowerCase && count(/[a-z]/g) < policy.minLowerCase) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.rules.minLowerCase',
                                                    { count: policy.minLowerCase },
                                                )
                                            }

                                            if (policy.minUpperCase && count(/[A-Z]/g) < policy.minUpperCase) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.rules.minUpperCase',
                                                    { count: policy.minUpperCase },
                                                )
                                            }

                                            if (
                                                policy.minSpecialChars &&
                                                count(/[^A-Za-z0-9]/g) < policy.minSpecialChars
                                            ) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.rules.minSpecialChars',
                                                    { count: policy.minSpecialChars },
                                                )
                                            }

                                            if (val.includes(' ')) {
                                                return t('dashboardLayout.userMenu.changePasswordDialog.rules.noSpace')
                                            }

                                            return true
                                        },
                                    }}
                                />

                                <BsInput
                                    label={t('dashboardLayout.userMenu.changePasswordDialog.confirmPassword')}
                                    type="password"
                                    isRequired
                                    minLength={6}
                                    maxLength={100}
                                    name="confirmPassword"
                                    rules={{
                                        validate: value => {
                                            const normalizedValue = String(value ?? '').trim()
                                            if (normalizedValue !== newPassword.trim()) {
                                                return t(
                                                    'dashboardLayout.userMenu.changePasswordDialog.validation.confirmPasswordNotMatch',
                                                )
                                            }
                                            return true
                                        },
                                    }}
                                />
                            </div>

                            {/* RIGHT: live password rules */}
                            <div className="rounded-md bg-muted/50 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    {t('dashboardLayout.userMenu.changePasswordDialog.rulesTitle')}
                                </p>
                                <ul className="space-y-1">
                                    {rules.map(rule => {
                                        const Icon = !hasStarted ? Circle : rule.pass ? Check : X
                                        const color = !hasStarted
                                            ? 'text-muted-foreground'
                                            : rule.pass
                                              ? 'text-green-600'
                                              : 'text-red-600'
                                        return (
                                            <li key={rule.key} className={`flex items-center gap-2 text-xs ${color}`}>
                                                <Icon className="size-3.5 shrink-0" />
                                                <span>{rule.label}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-2 px-1">
                            <div className="text-center space-y-1.5 max-w-xl mx-auto">
                                <p className="text-sm text-foreground/80">
                                    {userEmail
                                        ? t('dashboardLayout.userMenu.changePasswordDialog.otp.descriptionSent', {
                                              email: '{{email}}',
                                          })
                                              .split('{{email}}')
                                              .map((part, idx) =>
                                                  idx === 0 ? (
                                                      <span key={idx}>
                                                          {part}
                                                          <strong className="text-foreground font-bold">
                                                              {userEmail}
                                                          </strong>
                                                      </span>
                                                  ) : (
                                                      <span key={idx}>{part}</span>
                                                  ),
                                              )
                                        : t('dashboardLayout.userMenu.changePasswordDialog.otp.descriptionSentDefault')}
                                </p>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {t('dashboardLayout.userMenu.changePasswordDialog.otp.actionInstructions')}{' '}
                                    {otpExpiry > 0 ? (
                                        <span>
                                            {t('dashboardLayout.userMenu.changePasswordDialog.otp.expiryCountdown')}
                                            <strong className="text-red-600 font-mono font-bold mx-1">
                                                {formatExpiryTime(otpExpiry)}
                                            </strong>
                                            {t(
                                                'dashboardLayout.userMenu.changePasswordDialog.otp.expiryCountdownSuffix',
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-semibold block mt-1">
                                            {t('dashboardLayout.userMenu.changePasswordDialog.otp.expired')}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-col items-center justify-center space-y-4 max-w-xs mx-auto">
                                <div className="w-full">
                                    <Controller
                                        name="otp"
                                        control={form.control}
                                        rules={{
                                            required: true,
                                            validate: val => val?.trim().length === 6,
                                        }}
                                        render={({ field, fieldState }) => (
                                            <OtpInput
                                                value={field.value ?? ''}
                                                onChange={val => {
                                                    field.onChange(val)
                                                    if (fieldState.error) {
                                                        form.clearErrors('otp')
                                                    }
                                                    setIsMaxAttemptsReached(false)
                                                }}
                                                isDisabled={isPending}
                                                hasError={
                                                    (!!fieldState.error && form.formState.isSubmitted) ||
                                                    isMaxAttemptsReached
                                                }
                                            />
                                        )}
                                    />
                                </div>

                                <div className="text-center text-sm text-foreground/80 font-medium">
                                    {cooldown > 0 ? (
                                        <span>
                                            {t('dashboardLayout.userMenu.changePasswordDialog.otp.resendCooldown', {
                                                cooldown,
                                            })}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={async () => {
                                                try {
                                                    const res = await resendOtpMutation.mutateAsync()
                                                    setCooldown(res.cooldownMinutes * 60)
                                                    setOtpExpiry(res.expireMinutes * 60)
                                                    setIsMaxAttemptsReached(false)
                                                    form.setValue('otp', '')
                                                    form.clearErrors('otp')
                                                } catch (error) {
                                                    // handled by global react-query/axios interceptor
                                                }
                                            }}
                                            className="text-primary hover:underline font-semibold disabled:opacity-50"
                                        >
                                            {t('dashboardLayout.userMenu.changePasswordDialog.otp.resendButton')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </FormProvider>
            </LoadingOverlay>
        </FormDialogContent>
    )
})

ChangePasswordDialog.displayName = 'ChangePasswordDialog'
