'use client'

import React from 'react'
import {
    Input as AriaInput,
    InputProps as AriaInputProps,
    TextArea as AriaTextArea,
    TextAreaProps as AriaTextAreaProps,
    composeRenderProps,
    TextField as AriaTextField,
    TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, type Control, type RegisterOptions } from 'react-hook-form'
import {
    EMAIL_REGEX,
    isPhoneCharsValid,
    isPhoneLengthValid,
    hasHtmlOrScript,
    formatPhoneInput,
    PHONE_MAX_LENGTH,
} from '@workspace/ui/lib/validators'

import { cn } from '@workspace/ui/lib/utils'
import { copyTextToClipboard } from '@workspace/ui/lib/clipboard'
import { Label, FieldGroup } from '@workspace/ui/components/Field'
import {
    getFieldHighlightControlClass,
    getFieldHighlightLabelClass,
    getFieldHighlightMessageClass,
    type FieldHighlightVariant,
} from '@workspace/ui/lib/fieldHighlight'
import { Button } from '@workspace/ui/components/Button'
import { toast } from '@workspace/ui/components/Sonner'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import {
    EyeIcon,
    EyeOffIcon,
    XIcon,
    InfoIcon,
    PhoneIcon,
    PrinterIcon,
    MailIcon,
    Fingerprint,
    IdCard,
    ArrowRight,
    CopyIcon,
    CheckIcon,
} from 'lucide-react'

const normalizeLabelForPlaceholder = (label?: string) => {
    if (!label) return label
    const trimmed = label.trim()
    if (!trimmed) return ''

    return trimmed.toLocaleLowerCase('vi-VN')
}

const formatIdentityNo = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 12)
}

const formatDocumentNo = (value: string) => {
    return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
}

const formatVND = (value: string) => {
    const clean = value.replace(/\D/g, '')
    if (!clean) return ''
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const getIconColorClass = (hasError: boolean) =>
    cn(
        'size-3.5 transition-colors',
        hasError ? 'text-destructive' : 'text-muted-foreground group-focus-within/field:text-primary',
    )

/* ──────────────────────────────────────────────
 * Shared Sub-components & Helpers
 * ────────────────────────────────────────────── */

const TooltipInfoButton = ({ hasError }: { hasError: boolean }) => {
    const ref = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
        if (ref.current && ref.current.tabIndex !== -1) {
            ref.current.tabIndex = -1
        }
    })

    return (
        <Button
            ref={ref}
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-0 h-auto w-auto hover:bg-transparent z-10"
            excludeFromTabOrder
        >
            <InfoIcon className={getIconColorClass(hasError)} />
        </Button>
    )
}

const renderHeader = ({
    label,
    isRequired,
    description,
    hasError,
    fieldHighlight,
}: {
    label?: string
    isRequired?: boolean
    description?: string
    hasError: boolean
    fieldHighlight?: FieldHighlightVariant
}) => {
    if (!label) return null
    const activeHighlight = !hasError ? fieldHighlight : undefined
    return (
        <Label
            data-invalid={hasError ? true : undefined}
            className={cn(
                'group-focus-within/field:text-primary transition-colors relative flex items-center gap-1 w-fit max-w-full overflow-hidden',
                hasError && 'text-destructive!',
                activeHighlight && getFieldHighlightLabelClass(activeHighlight),
            )}
        >
            {description && (
                <TooltipTrigger delay={0}>
                    <TooltipInfoButton hasError={hasError} />
                    <Tooltip>{description}</Tooltip>
                </TooltipTrigger>
            )}
            <span className={cn('truncate min-w-0', description ? 'pl-5' : '')} title={label}>
                {label}
            </span>
            {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
        </Label>
    )
}

const FieldDecorator = ({
    isPhone,
    isFax,
    isEmail,
    isIdentityNo,
    isDocumentNo,
    hasError,
}: {
    isPhone?: boolean
    isFax?: boolean
    isEmail?: boolean
    isIdentityNo?: boolean
    isDocumentNo?: boolean
    hasError: boolean
}) => {
    if (!isPhone && !isFax && !isEmail && !isIdentityNo && !isDocumentNo) return null
    return (
        <div className={cn('pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center')}>
            {isPhone && <PhoneIcon className={getIconColorClass(hasError)} />}
            {isFax && <PrinterIcon className={getIconColorClass(hasError)} />}
            {isEmail && <MailIcon className={getIconColorClass(hasError)} />}
            {isIdentityNo && <Fingerprint className={getIconColorClass(hasError)} />}
            {isDocumentNo && <IdCard className={getIconColorClass(hasError)} />}
        </div>
    )
}

const ClearButton = ({
    onClick,
    hasError,
    className,
}: {
    onClick: () => void
    hasError: boolean
    className?: string
}) => (
    <Button
        type="button"
        variant="ghost"
        size="iconSm"
        className={cn('absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6', className)}
        onClick={onClick}
        excludeFromTabOrder
    >
        <XIcon className={getIconColorClass(hasError)} />
    </Button>
)

interface PasswordInputProps extends AriaTextFieldProps {
    placeholder?: string
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
        <AriaTextField {...props} isInvalid={(props as any)['aria-invalid']}>
            <div className="relative group/field">
                <Input
                    ref={ref}
                    type={isVisible ? 'text' : 'password'}
                    placeholder={props.placeholder}
                    className={cn('pr-8', className)}
                />
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setIsVisible(!isVisible)}
                    excludeFromTabOrder
                >
                    {isVisible ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
                </Button>
            </div>
        </AriaTextField>
    )
})

PasswordInput.displayName = 'PasswordInput'

const Input = React.forwardRef<HTMLInputElement, AriaInputProps>(({ className, ...props }, ref) => {
    return (
        <AriaInput
            ref={ref}
            autoComplete="off"
            className={composeRenderProps(className, className =>
                cn(
                    'shadow-sm flex h-8 w-full rounded-sm bg-background px-3 py-1.5 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground md:text-sm',
                    'ring-inset ring ring-input',
                    'transition-all data-[focused]:ring-primary data-[focused]:ring-2 data-[focused]:bg-primary/5 data-[focused]:placeholder:text-primary/60',
                    'aria-invalid:ring-destructive! aria-invalid:ring-2! data-[invalid]:ring-destructive! data-[invalid]:ring-2!',
                    'data-[invalid]:placeholder:text-destructive/60 data-[invalid]:bg-destructive/10',
                    'data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:text-muted-foreground',
                    'focus-visible:outline-none',
                    className,
                ),
            )}
            {...props}
        />
    )
})

Input.displayName = 'Input'

const TextArea = React.forwardRef<HTMLTextAreaElement, AriaTextAreaProps>(({ className, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null)
    const combinedRef = (node: HTMLTextAreaElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
    }

    const adjustHeight = React.useCallback(() => {
        const node = internalRef.current
        if (node) {
            node.style.height = 'auto'
            const scrollHeight = node.scrollHeight
            node.style.height = `${Math.max(scrollHeight, 80)}px`
        }
    }, [])

    React.useEffect(() => {
        adjustHeight()
    }, [props.value, adjustHeight])

    return (
        <AriaTextArea
            ref={combinedRef}
            className={composeRenderProps(className, className =>
                cn(
                    'shadow-sm flex min-h-[80px] w-full rounded-sm bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground md:text-sm',
                    'ring-inset ring ring-input',
                    'transition-all data-[focused]:ring-primary data-[focused]:ring-2 data-[focused]:bg-primary/5 data-[focused]:placeholder:text-primary/60',
                    'aria-invalid:ring-destructive! aria-invalid:ring-2! data-[invalid]:ring-destructive! data-[invalid]:ring-2!',
                    'data-[invalid]:placeholder:text-destructive/60 data-[invalid]:bg-destructive/10',
                    'data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted data-[disabled]:text-muted-foreground',
                    'focus-visible:outline-none resize-none overflow-hidden',
                    className,
                ),
            )}
            onChange={e => {
                onChange?.(e)
                adjustHeight()
            }}
            {...props}
        />
    )
})

TextArea.displayName = 'TextArea'

/* ──────────────────────────────────────────────
 * Form-integrated wrappers
 * ────────────────────────────────────────────── */

export type BsInputFormat = 'integer' | 'email' | 'phone' | 'fax' | 'identityNo' | 'documentNo' | 'vnd' | 'numeric'

interface BsInputProps extends AriaInputProps {
    label?: string
    isRequired?: boolean
    format?: BsInputFormat
    isInteger?: boolean
    isEmail?: boolean
    isPhone?: boolean
    isIdentityNo?: boolean
    isNumeric?: boolean
    phoneMinDigits?: number
    phoneMaxDigits?: number
    errorMessage?: string
    name?: string
    control?: Control<any>
    rules?: RegisterOptions
    isClearable?: boolean
    showCharacterCount?: boolean
    containerClassName?: string
    isDisabled?: boolean
    description?: string
    fieldHighlight?: FieldHighlightVariant
    highlightMessage?: string
    prefixText?: string
    isCopyable?: boolean
}

function BsInput({
    label,
    isRequired,
    format,
    isInteger,
    isEmail,
    isPhone,
    isIdentityNo,
    isNumeric,
    phoneMinDigits,
    phoneMaxDigits,
    errorMessage,
    name: fieldName,
    control,
    rules,
    isClearable = true,
    containerClassName,
    description,
    fieldHighlight,
    highlightMessage,
    prefixText,
    isCopyable = false,
    ...inputProps
}: BsInputProps) {
    const { t } = useTranslation()
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)
    const isPassword = inputProps.type === 'password'

    const prefixRef = React.useRef<HTMLSpanElement>(null)
    const [prefixWidth, setPrefixWidth] = React.useState(0)
    React.useLayoutEffect(() => {
        setPrefixWidth(prefixText && prefixRef.current ? prefixRef.current.offsetWidth : 0)
    }, [prefixText])

    const handleCopy = React.useCallback(
        async (text: string, anchor?: HTMLElement | null) => {
            if (!text) return

            if (await copyTextToClipboard(text, anchor)) {
                setIsCopied(true)
                window.setTimeout(() => setIsCopied(false), 1500)
                const fieldLabel = typeof label === 'string' ? label : ''
                toast.success({
                    title: '',
                    description: fieldLabel ? t('common.copiedField', { field: fieldLabel }) : t('common.copied'),
                })
            } else {
                toast.error({ title: '', description: t('common.copyFailed') })
            }
        },
        [label, t],
    )

    const activeFormat =
        format ||
        (isInteger && 'integer') ||
        (isEmail && 'email') ||
        (isPhone && 'phone') ||
        (isIdentityNo && 'identityNo') ||
        (isNumeric && 'numeric') ||
        undefined
    const isIntegerInput = activeFormat === 'integer'
    const isEmailInput = activeFormat === 'email' || inputProps.type === 'email'
    const isPhoneInput = activeFormat === 'phone'
    const isFaxInput = activeFormat === 'fax'
    const isIdentityNoInput = activeFormat === 'identityNo'
    const isDocumentNoInput = activeFormat === 'documentNo'
    const isVndInput = activeFormat === 'vnd'
    const isNumericInput = activeFormat === 'numeric'
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control
    const autoPlaceholder = label
        ? t('forms.placeholder.input', { label: normalizeLabelForPlaceholder(label) })
        : t('common.input')
    const resolvedPlaceholder = inputProps.isDisabled ? '' : (inputProps.placeholder ?? autoPlaceholder)
    const { isDisabled: _isDisabled, ...domInputProps } = inputProps

    const autoRules: RegisterOptions = {
        ...(isRequired
            ? {
                  required: t('forms.validation.required', { label: label ?? t('common.field') }),
              }
            : {}),
        ...(typeof inputProps.minLength === 'number'
            ? {
                  minLength: {
                      value: inputProps.minLength,
                      message: t('forms.validation.minLength', {
                          label: label ?? t('common.field'),
                          min: inputProps.minLength,
                      }),
                  },
              }
            : {}),
        ...(typeof inputProps.maxLength === 'number'
            ? {
                  maxLength: {
                      value: inputProps.maxLength,
                      message: t('forms.validation.maxLength', {
                          label: label ?? t('common.field'),
                          max: inputProps.maxLength,
                      }),
                  },
              }
            : {}),
        ...(typeof inputProps.min === 'number'
            ? {
                  min: {
                      value: inputProps.min,
                      message: t('forms.validation.min', {
                          label: label ?? t('common.field'),
                          min: inputProps.min,
                      }),
                  },
              }
            : {}),
        ...(typeof inputProps.max === 'number'
            ? {
                  max: {
                      value: inputProps.max,
                      message: t('forms.validation.max', {
                          label: label ?? t('common.field'),
                          max: inputProps.max,
                      }),
                  },
              }
            : {}),
    }

    const mergedRules = {
        ...autoRules,
        ...(rules ?? {}),
    } as RegisterOptions

    const builtinValidators: Array<
        (value: unknown) => Promise<true | string | false | undefined> | true | string | false
    > = []

    // Validate that input does not contain HTML/script tags
    builtinValidators.push(value => {
        if (hasHtmlOrScript(value)) {
            return t('forms.validation.noHtmlScript')
        }
        return true
    })

    if (isIntegerInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const num = Number(raw)
            const ok = Number.isFinite(num) && Number.isInteger(num)
            if (!ok) {
                return t('forms.validation.integer', { label: label ?? t('common.field') })
            }

            return true
        })
    }

    if (isEmailInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const isValid = EMAIL_REGEX.test(raw)
            return isValid || t('forms.validation.email')
        })
    }

    if (isPhoneInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const isCharsValid = isPhoneCharsValid(raw)
            if (!isCharsValid) return t('forms.validation.phone')

            const isLenValid = isPhoneLengthValid(raw, phoneMinDigits, phoneMaxDigits)
            return isLenValid || t('forms.validation.phone')
        })
    }

    if (isFaxInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const isCharsValid = isPhoneCharsValid(raw)
            if (!isCharsValid) return t('forms.validation.fax')

            const isLenValid = isPhoneLengthValid(raw, phoneMinDigits, phoneMaxDigits)
            return isLenValid || t('forms.validation.fax')
        })
    }

    if (isIdentityNoInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const isValid = /^\d{12}$/.test(raw.replace(/\s+/g, ''))
            return isValid || t('forms.validation.identityNo')
        })
    }

    if (isDocumentNoInput) {
        builtinValidators.push(async value => {
            const raw = String(value ?? '').trim()
            if (!raw) return true

            const isValid = /^[a-zA-Z0-9]{2,20}$/.test(raw.replace(/\s+/g, ''))
            return isValid || t('forms.validation.documentNo')
        })
    }

    if (builtinValidators.length > 0) {
        const userValidate = rules?.validate
        const normalizeResult = (res: unknown): boolean | string => {
            if (res === true) return true
            if (res === false) return false
            if (typeof res === 'string') return res
            // If user validator returns something else, treat as pass.
            return true
        }

        mergedRules.validate = async (value: unknown) => {
            for (const validator of builtinValidators) {
                const res = await validator(value)
                const normalized = normalizeResult(res)
                if (normalized !== true) return normalized
            }

            if (!userValidate) return true

            if (typeof userValidate === 'function') {
                const res = userValidate(value, undefined as any)
                return normalizeResult((await res) as unknown)
            }

            // RHF allows validate as an object of validators
            if (typeof userValidate === 'object') {
                const validators = userValidate as Record<string, (v: unknown, values: unknown) => unknown>
                for (const key of Object.keys(validators)) {
                    const res = validators[key]?.(value, undefined as any)
                    const normalized = normalizeResult((await res) as unknown)
                    if (normalized !== true) return normalized
                }
            }

            return true
        }
    }

    const resolvedDescription = inputProps.isDisabled
        ? undefined
        : description ||
          (isPhoneInput
              ? t('forms.hints.phone')
              : isFaxInput
                ? t('forms.hints.fax')
                : isEmailInput
                  ? t('forms.hints.email')
                  : isIdentityNoInput
                    ? t('forms.hints.identityNo')
                    : isDocumentNoInput
                      ? t('forms.hints.documentNo')
                      : undefined)

    const renderInputContent = ({
        value,
        onChange,
        onBlur,
        hasError,
    }: {
        value: any
        onChange: (v: any) => void
        onBlur?: (e: any) => void
        hasError: boolean
    }) => {
        const activeHighlight = !hasError ? fieldHighlight : undefined
        return (
            <div className="relative">
                <FieldDecorator
                    isPhone={isPhoneInput}
                    isFax={isFaxInput}
                    isEmail={isEmailInput}
                    isIdentityNo={isIdentityNoInput}
                    isDocumentNo={isDocumentNoInput}
                    hasError={hasError}
                />
                {prefixText && (
                    <span
                        ref={prefixRef}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium select-none pointer-events-none whitespace-nowrap"
                    >
                        {prefixText}
                    </span>
                )}
                <Input
                    {...domInputProps}
                    style={prefixWidth ? { paddingLeft: prefixWidth + 12 } : inputProps.style}
                    type={isPassword ? (isPasswordVisible ? 'text' : 'password') : inputProps.type}
                    disabled={inputProps.isDisabled}
                    maxLength={
                        isPhoneInput || isFaxInput
                            ? PHONE_MAX_LENGTH
                            : isIdentityNoInput
                              ? 12
                              : isDocumentNoInput
                                ? 20
                                : inputProps.maxLength
                    }
                    aria-invalid={hasError}
                    placeholder={resolvedPlaceholder}
                    value={isVndInput ? formatVND(String(value ?? '')) : (value ?? '')}
                    onChange={e => {
                        let val = (e.target as HTMLInputElement).value
                        if (isPhoneInput || isFaxInput) val = formatPhoneInput(val)
                        else if (isEmailInput) val = val.toLowerCase()
                        else if (isIdentityNoInput) val = formatIdentityNo(val)
                        else if (isDocumentNoInput) val = formatDocumentNo(val)
                        else if (isVndInput) val = formatVND(val)
                        else if (isNumericInput) val = val.replace(/\D/g, '')
                        onChange(val)
                        inputProps.onChange?.(e)
                    }}
                    onBlur={e => {
                        const val = String(value ?? '')
                        const trimmed = val.trim()
                        if (val !== trimmed) onChange(trimmed)
                        onBlur?.(e)
                        inputProps.onBlur?.(e)
                    }}
                    className={cn(
                        inputProps.className,
                        (isPassword && isClearable) || (isCopyable && isClearable)
                            ? 'pr-14'
                            : isClearable || isPassword || isCopyable
                              ? 'pr-8'
                              : '',
                        isPhoneInput || isFaxInput || isEmailInput || isIdentityNoInput || isDocumentNoInput
                            ? 'pl-8'
                            : '',
                        prefixText ? 'pl-11' : '',
                        activeHighlight && getFieldHighlightControlClass(activeHighlight),
                    )}
                />
                {isPassword && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        excludeFromTabOrder
                    >
                        {isPasswordVisible ? (
                            <EyeIcon className={getIconColorClass(hasError)} />
                        ) : (
                            <EyeOffIcon className={getIconColorClass(hasError)} />
                        )}
                    </Button>
                )}
                {isClearable && !inputProps.isDisabled && String(value ?? '').length > 0 && (
                    <ClearButton
                        className={isPassword ? 'right-7' : isCopyable ? 'right-8' : 'right-1'}
                        onClick={() => onChange('')}
                        hasError={hasError}
                    />
                )}
                {isCopyable && String(value ?? '').length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={e => handleCopy(String(value ?? ''), e.currentTarget as HTMLElement)}
                        excludeFromTabOrder
                    >
                        {isCopied ? (
                            <CheckIcon className="text-green-600" />
                        ) : (
                            <CopyIcon className={getIconColorClass(hasError)} />
                        )}
                    </Button>
                )}
            </div>
        )
    }

    if (fieldName && resolvedControl) {
        return (
            <div className={cn('group/field', containerClassName)}>
                <Controller
                    name={fieldName}
                    control={resolvedControl}
                    rules={mergedRules}
                    render={({ field, fieldState }) => {
                        const errMsg = fieldState.error?.message || errorMessage
                        const hasError = !!errMsg

                        return (
                            <>
                                {renderHeader({
                                    label,
                                    isRequired,
                                    description: resolvedDescription,
                                    hasError,
                                    fieldHighlight,
                                })}
                                {renderInputContent({
                                    value: field.value,
                                    onChange: field.onChange,
                                    onBlur: field.onBlur,
                                    hasError,
                                })}
                                {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                                {!errMsg && highlightMessage && fieldHighlight && (
                                    <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(fieldHighlight))}>
                                        {highlightMessage}
                                    </p>
                                )}
                            </>
                        )
                    }}
                />
            </div>
        )
    }

    return (
        <div className={containerClassName}>
            {renderHeader({
                label,
                isRequired,
                description: resolvedDescription,
                hasError: !!errorMessage,
                fieldHighlight,
            })}
            {renderInputContent({
                value: inputProps.value,
                onChange: _v => {
                    // Handle non-RHF onChange if needed, but usually BsInput is used with RHF
                },
                hasError: !!errorMessage,
            })}
            {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            {!errorMessage && highlightMessage && fieldHighlight && (
                <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(fieldHighlight))}>{highlightMessage}</p>
            )}
        </div>
    )
}

interface BsTextAreaProps extends AriaTextAreaProps {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
    rules?: RegisterOptions
    isClearable?: boolean
    showCharacterCount?: boolean
    containerClassName?: string
    isDisabled?: boolean
    description?: string
    fieldHighlight?: FieldHighlightVariant
    highlightMessage?: string
}

function BsTextArea({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    rules,
    isClearable = true,
    showCharacterCount = true,
    containerClassName,
    description,
    fieldHighlight,
    highlightMessage,
    ...textAreaProps
}: BsTextAreaProps) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control
    const autoPlaceholder = label
        ? t('forms.placeholder.input', { label: normalizeLabelForPlaceholder(label) })
        : t('common.input')
    const resolvedPlaceholder = textAreaProps.isDisabled ? '' : (textAreaProps.placeholder ?? autoPlaceholder)
    const { isDisabled: _isDisabled, ...domTextAreaProps } = textAreaProps

    const autoRules: RegisterOptions = {
        ...(isRequired
            ? {
                  required: t('forms.validation.required', { label: label ?? t('common.field') }),
              }
            : {}),
        ...(typeof textAreaProps.minLength === 'number'
            ? {
                  minLength: {
                      value: textAreaProps.minLength,
                      message: t('forms.validation.minLength', {
                          label: label ?? t('common.field'),
                          min: textAreaProps.minLength,
                      }),
                  },
              }
            : {}),
        ...(typeof textAreaProps.maxLength === 'number'
            ? {
                  maxLength: {
                      value: textAreaProps.maxLength,
                      message: t('forms.validation.maxLength', {
                          label: label ?? t('common.field'),
                          max: textAreaProps.maxLength,
                      }),
                  },
              }
            : {}),
    }

    const mergedRules = {
        ...autoRules,
        ...(rules ?? {}),
    } as RegisterOptions

    const builtinValidators: Array<
        (value: unknown) => Promise<true | string | false | undefined> | true | string | false
    > = []

    // Validate that textarea does not contain HTML/script tags
    builtinValidators.push(value => {
        if (hasHtmlOrScript(value)) {
            return t('forms.validation.noHtmlScript')
        }
        return true
    })

    if (builtinValidators.length > 0) {
        const userValidate = rules?.validate
        const normalizeResult = (res: unknown): boolean | string => {
            if (res === true) return true
            if (res === false) return false
            if (typeof res === 'string') return res
            return true
        }

        mergedRules.validate = async (value: unknown) => {
            for (const validator of builtinValidators) {
                const res = await validator(value)
                const normalized = normalizeResult(res)
                if (normalized !== true) return normalized
            }

            if (!userValidate) return true

            if (typeof userValidate === 'function') {
                const res = userValidate(value, undefined as any)
                return normalizeResult((await res) as unknown)
            }

            if (typeof userValidate === 'object') {
                const validators = userValidate as Record<string, (v: unknown, values: unknown) => unknown>
                for (const key of Object.keys(validators)) {
                    const res = validators[key]?.(value, undefined as any)
                    const normalized = normalizeResult((await res) as unknown)
                    if (normalized !== true) return normalized
                }
            }

            return true
        }
    }

    const isEmailInputType = (textAreaProps as any).isEmail || (textAreaProps as any).type === 'email'
    const isPhoneInput = (textAreaProps as any).isPhone
    const resolvedDescription = textAreaProps.isDisabled
        ? undefined
        : description || (isPhoneInput ? t('forms.hints.phone') : isEmailInputType ? t('forms.hints.email') : undefined)

    const renderTextAreaContent = ({
        value,
        onChange,
        onBlur,
        hasError,
    }: {
        value: any
        onChange: (v: any) => void
        onBlur?: (e: any) => void
        hasError: boolean
    }) => {
        const currentLength = String(value ?? '').length
        const maxLength = typeof textAreaProps.maxLength === 'number' ? textAreaProps.maxLength : undefined
        const activeHighlight = !hasError ? fieldHighlight : undefined

        return (
            <div className="relative">
                <TextArea
                    {...domTextAreaProps}
                    disabled={textAreaProps.isDisabled}
                    maxLength={undefined}
                    aria-invalid={hasError}
                    placeholder={resolvedPlaceholder}
                    value={value ?? ''}
                    onChange={e => {
                        onChange((e.target as HTMLTextAreaElement).value)
                        textAreaProps.onChange?.(e)
                    }}
                    onBlur={e => {
                        const val = String(value ?? '')
                        const trimmed = val.trim()
                        if (val !== trimmed) onChange(trimmed)
                        onBlur?.(e)
                        textAreaProps.onBlur?.(e)
                    }}
                    className={cn(
                        textAreaProps.className,
                        isClearable ? 'pr-8' : '',
                        showCharacterCount ? 'pb-6' : '',
                        activeHighlight && getFieldHighlightControlClass(activeHighlight),
                    )}
                />
                {isClearable && !textAreaProps.isDisabled && String(value ?? '').length > 0 && (
                    <ClearButton className="top-1 translate-y-0" onClick={() => onChange('')} hasError={hasError} />
                )}
                {showCharacterCount && (
                    <span
                        className={cn(
                            'pointer-events-none absolute bottom-1.5 right-2 text-[11px] transition-colors',
                            hasError
                                ? 'text-destructive'
                                : 'text-muted-foreground group-focus-within/field:text-primary',
                        )}
                    >
                        {maxLength
                            ? `${currentLength}/${maxLength} ${t('common.characters')}`
                            : `${currentLength} ${t('common.characters')}`}
                    </span>
                )}
            </div>
        )
    }

    if (fieldName && resolvedControl) {
        return (
            <div className={cn('group/field', containerClassName)}>
                <Controller
                    name={fieldName}
                    control={resolvedControl}
                    rules={mergedRules}
                    render={({ field, fieldState }) => {
                        const errMsg = fieldState.error?.message || errorMessage
                        const hasError = !!errMsg

                        return (
                            <>
                                {renderHeader({
                                    label,
                                    isRequired,
                                    description: resolvedDescription,
                                    hasError,
                                    fieldHighlight,
                                })}
                                {renderTextAreaContent({
                                    value: field.value,
                                    onChange: field.onChange,
                                    onBlur: field.onBlur,
                                    hasError,
                                })}
                                {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                                {!errMsg && highlightMessage && fieldHighlight && (
                                    <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(fieldHighlight))}>
                                        {highlightMessage}
                                    </p>
                                )}
                            </>
                        )
                    }}
                />
            </div>
        )
    }

    return (
        <div className={containerClassName}>
            {renderHeader({
                label,
                isRequired,
                description: resolvedDescription,
                hasError: !!errorMessage,
                fieldHighlight,
            })}
            {renderTextAreaContent({
                value: textAreaProps.value,
                onChange: _v => {
                    // Handle non-RHF
                },
                hasError: !!errorMessage,
            })}
            {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            {!errorMessage && highlightMessage && fieldHighlight && (
                <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(fieldHighlight))}>{highlightMessage}</p>
            )}
        </div>
    )
}

const NumbersIcon = ({ colorClass }: { colorClass?: string }) => (
    <span
        aria-hidden
        className={cn('font-mono text-xs font-bold select-none text-muted-foreground/75 transition-colors', colorClass)}
    >
        123
    </span>
)

interface BsNumberRangeProps {
    label?: string
    nameFrom: string
    nameTo: string
    isRequired?: boolean
    rulesFrom?: RegisterOptions
    rulesTo?: RegisterOptions
    containerClassName?: string
    placeholderFrom?: string
    placeholderTo?: string
    minValue?: number
    maxValue?: number
    step?: number
    isDisabled?: boolean
    validateRange?: boolean
}

function BsNumberRange({
    label,
    nameFrom,
    nameTo,
    isRequired,
    rulesFrom,
    rulesTo,
    containerClassName,
    placeholderFrom,
    placeholderTo,
    minValue,
    maxValue,
    step = 1,
    isDisabled,
    validateRange = true,
}: BsNumberRangeProps) {
    const { t } = useTranslation()
    const {
        control,
        formState: { errors },
        watch,
        setValue,
    } = useFormContext()

    const resolvedPlaceholderFrom = placeholderFrom ?? t('forms.placeholder.from')
    const resolvedPlaceholderTo = placeholderTo ?? t('forms.placeholder.to')

    const watchFrom = watch(nameFrom)
    const watchTo = watch(nameTo)

    const errorFrom = errors[nameFrom]?.message
    const errorTo = errors[nameTo]?.message
    const hasError = !!(errorFrom || errorTo)

    const hasValueFrom = watchFrom !== null && watchFrom !== undefined && watchFrom !== ''
    const hasValueTo = watchTo !== null && watchTo !== undefined && watchTo !== ''
    const hasAnyValue = hasValueFrom || hasValueTo

    const iconColorClass = cn(
        'text-muted-foreground transition-colors group-focus-within/field:text-primary',
        hasError && 'text-destructive!',
    )
    const fieldInputFromClassName =
        'w-20 h-full bg-transparent px-1.5 outline-none text-sm placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 text-left'
    const fieldInputToClassName =
        'flex-1 w-full min-w-0 h-full bg-transparent px-1.5 outline-none text-sm placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 text-left'

    const mergedRulesFrom: RegisterOptions = {
        ...(isRequired ? { required: t('forms.validation.required', { label: label ?? t('common.field') }) } : {}),
        ...(typeof minValue === 'number'
            ? { min: { value: minValue, message: t('forms.validation.min', { label, min: minValue }) } }
            : {}),
        ...(typeof maxValue === 'number'
            ? { max: { value: maxValue, message: t('forms.validation.max', { label, max: maxValue }) } }
            : {}),
        ...(validateRange
            ? {
                  validate: {
                      rangeCheck: (val: number | null) => {
                          if (val === null || val === undefined) return true
                          const to = watchTo
                          if (to === null || to === undefined || to === '') return true
                          return Number(val) <= Number(to) || t('forms.validation.rangeInvalid')
                      },
                      ...(rulesFrom?.validate as object | undefined),
                  },
              }
            : {}),
        ...rulesFrom,
    }

    const mergedRulesTo: RegisterOptions = {
        ...(isRequired ? { required: t('forms.validation.required', { label: label ?? t('common.field') }) } : {}),
        ...(typeof minValue === 'number'
            ? { min: { value: minValue, message: t('forms.validation.min', { label, min: minValue }) } }
            : {}),
        ...(typeof maxValue === 'number'
            ? { max: { value: maxValue, message: t('forms.validation.max', { label, max: maxValue }) } }
            : {}),
        ...(validateRange
            ? {
                  validate: {
                      rangeCheck: (val: number | null) => {
                          if (val === null || val === undefined) return true
                          const from = watchFrom
                          if (from === null || from === undefined || from === '') return true
                          return Number(from) <= Number(val) || t('forms.validation.rangeInvalid')
                      },
                      ...(rulesTo?.validate as object | undefined),
                  },
              }
            : {}),
        ...rulesTo,
    }

    return (
        <div className={cn('group/field flex flex-col gap-2 w-full', containerClassName)}>
            {label && (
                <Label
                    data-invalid={hasError ? true : undefined}
                    className="group-focus-within/field:text-primary transition-colors flex items-center gap-1 w-fit max-w-full overflow-hidden"
                >
                    <span className="truncate min-w-0" title={label}>
                        {label}
                    </span>
                    {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
                </Label>
            )}

            <FieldGroup isInvalid={hasError} isDisabled={isDisabled} className="h-8 px-2 gap-1 flex items-center">
                <div className="-ml-1 size-7 shrink-0 flex items-center justify-center">
                    <NumbersIcon colorClass={iconColorClass} />
                </div>

                <Controller
                    name={nameFrom}
                    control={control}
                    rules={mergedRulesFrom}
                    render={({ field }) => (
                        <input
                            type="number"
                            className={fieldInputFromClassName}
                            placeholder={resolvedPlaceholderFrom}
                            value={field.value ?? ''}
                            onChange={e => {
                                const val = e.target.value
                                field.onChange(val === '' ? null : Number(val))
                            }}
                            min={minValue}
                            max={maxValue}
                            step={step}
                            disabled={isDisabled}
                        />
                    )}
                />

                <ArrowRight
                    aria-hidden
                    className="size-3 text-muted-foreground opacity-50 mx-0.5 select-none flex-shrink-0"
                />

                <Controller
                    name={nameTo}
                    control={control}
                    rules={mergedRulesTo}
                    render={({ field }) => (
                        <input
                            type="number"
                            className={fieldInputToClassName}
                            placeholder={resolvedPlaceholderTo}
                            value={field.value ?? ''}
                            onChange={e => {
                                const val = e.target.value
                                field.onChange(val === '' ? null : Number(val))
                            }}
                            min={minValue}
                            max={maxValue}
                            step={step}
                            disabled={isDisabled}
                        />
                    )}
                />

                {hasAnyValue && !isDisabled && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="-mr-1 shrink-0"
                        onClick={() => {
                            setValue(nameFrom, null, { shouldValidate: true })
                            setValue(nameTo, null, { shouldValidate: true })
                        }}
                        excludeFromTabOrder
                    >
                        <XIcon className={cn('size-3.5', hasError ? 'text-destructive' : 'text-muted-foreground')} />
                    </Button>
                )}
            </FieldGroup>

            {errorFrom && typeof errorFrom === 'string' && (
                <p className="text-xs text-destructive mt-1 font-medium">{errorFrom}</p>
            )}
            {errorTo && typeof errorTo === 'string' && errorTo !== errorFrom && (
                <p className="text-xs text-destructive mt-1 font-medium">{errorTo}</p>
            )}
        </div>
    )
}

BsNumberRange.displayName = 'BsNumberRange'

export { Input, TextArea, PasswordInput, BsInput, BsTextArea, BsNumberRange }
export type { BsNumberRangeProps }
