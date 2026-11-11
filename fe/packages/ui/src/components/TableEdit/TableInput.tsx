'use client'

import React from 'react'
import { Input } from '@workspace/ui/components/Textfield'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/Button'
import { XIcon, PhoneIcon, MailIcon, Fingerprint, IdCard } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
    EMAIL_REGEX,
    isPhoneCharsValid,
    isPhoneLengthValid,
    hasHtmlOrScript,
    formatPhoneInput,
    PHONE_MAX_LENGTH,
} from '@workspace/ui/lib/validators'

const formatIdentityNo = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 12)
}

const formatDocumentNo = (value: string) => {
    return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
}

export type TableInputFormat = 'email' | 'phone' | 'identityNo' | 'documentNo'

interface TableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: string
    onChange?: (value: string) => void
    isInvalid?: boolean
    isClearable?: boolean
    isDisabled?: boolean
    className?: string
    format?: TableInputFormat
}

const getIconColorClass = (hasError: boolean) =>
    cn(
        'size-3.5 transition-colors',
        hasError ? 'text-destructive' : 'text-muted-foreground group-focus-within/table-input:text-primary',
    )

export const TableInput = React.forwardRef<HTMLInputElement, TableInputProps>(
    ({ value, onChange, isInvalid, isClearable = true, isDisabled, className, format, ...props }, ref) => {
        const showClear = isClearable && !isDisabled && value && value.length > 0
        const hasIcon = !isDisabled && format && ['phone', 'email', 'identityNo', 'documentNo'].includes(format)

        const resolvedMaxLength =
            props.maxLength ??
            (format === 'phone'
                ? PHONE_MAX_LENGTH
                : format === 'identityNo'
                  ? 12
                  : format === 'documentNo'
                    ? 20
                    : undefined)

        return (
            <div className="relative group/table-input w-full flex items-center">
                {hasIcon && (
                    <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex items-center z-10">
                        {format === 'phone' && <PhoneIcon className={getIconColorClass(!!isInvalid)} />}
                        {format === 'email' && <MailIcon className={getIconColorClass(!!isInvalid)} />}
                        {format === 'identityNo' && <Fingerprint className={getIconColorClass(!!isInvalid)} />}
                        {format === 'documentNo' && <IdCard className={getIconColorClass(!!isInvalid)} />}
                    </div>
                )}
                <Input
                    ref={ref}
                    value={value ?? ''}
                    disabled={isDisabled}
                    aria-invalid={isInvalid}
                    maxLength={resolvedMaxLength}
                    onChange={e => {
                        let val = e.target.value
                        if (format === 'phone') {
                            val = formatPhoneInput(val)
                        } else if (format === 'email') {
                            val = val.toLowerCase()
                        } else if (format === 'identityNo') {
                            val = formatIdentityNo(val)
                        } else if (format === 'documentNo') {
                            val = formatDocumentNo(val)
                        }
                        onChange?.(val)
                    }}
                    className={cn(
                        'h-8 px-2 py-1', // Density for table usage
                        hasIcon ? 'pl-7' : '',
                        isClearable && !isDisabled && 'pr-8',
                        className,
                    )}
                    {...props}
                />
                {showClear && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => onChange?.('')}
                    >
                        <XIcon className={getIconColorClass(!!isInvalid)} />
                    </Button>
                )}
            </div>
        )
    },
)

TableInput.displayName = 'TableInput'

interface BsTableInputProps extends TableInputProps {
    name: string
    control?: any
    rules?: any
    isRequired?: boolean
    isEmail?: boolean
    isPhone?: boolean
    label?: string
    phoneMinDigits?: number
    phoneMaxDigits?: number
}

export const BsTableInput = ({
    name,
    control,
    rules,
    isRequired,
    isEmail,
    isPhone,
    label,
    phoneMinDigits,
    phoneMaxDigits,
    format,
    ...props
}: BsTableInputProps) => {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const activeFormat = format || (isEmail ? 'email' : isPhone ? 'phone' : undefined)

    const autoRules = {
        ...(isRequired ? { required: t('forms.validation.required', { label: label ?? t('common.field') }) } : {}),
        ...(rules ?? {}),
    }

    const validate = async (value: any) => {
        const raw = String(value ?? '').trim()
        if (!raw) return true

        if (hasHtmlOrScript(value)) {
            return t('forms.validation.noHtmlScript')
        }

        if (activeFormat === 'email') {
            if (!EMAIL_REGEX.test(raw)) return t('forms.validation.email')
        }

        if (activeFormat === 'phone') {
            if (!isPhoneCharsValid(raw)) return t('forms.validation.phone')
            if (!isPhoneLengthValid(raw, phoneMinDigits, phoneMaxDigits)) return t('forms.validation.phone')
        }

        if (activeFormat === 'documentNo') {
            if (!/^[a-zA-Z0-9]{2,12}$/.test(raw.replace(/\s+/g, ''))) {
                return t('forms.validation.documentNo')
            }
        }

        if (rules?.validate) {
            if (typeof rules.validate === 'function') {
                return await rules.validate(value)
            }
            if (typeof rules.validate === 'object') {
                for (const key in rules.validate) {
                    const res = await rules.validate[key](value)
                    if (res !== true) return res
                }
            }
        }
        return true
    }

    return (
        <Controller
            name={name}
            control={resolvedControl}
            rules={{ ...autoRules, validate }}
            render={({ field, fieldState }) => {
                const error = fieldState.error
                return (
                    <div className="relative flex flex-col justify-center min-h-[32px]">
                        <TableInput
                            {...props}
                            format={activeFormat}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            isInvalid={!!error}
                            isDisabled={props.isDisabled}
                        />
                        {error && (
                            <span className="text-[11px] text-destructive font-medium leading-tight mt-1 animate-in fade-in slide-in-from-top-1 duration-200 block">
                                {error.message}
                            </span>
                        )}
                    </div>
                )
            }}
        />
    )
}
