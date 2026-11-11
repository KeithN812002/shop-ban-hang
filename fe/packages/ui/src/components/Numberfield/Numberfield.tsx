'use client'

import React, { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, type RegisterOptions } from 'react-hook-form'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'
import { Label, FieldGroup } from '@workspace/ui/components/Field'
import { Separator } from '@workspace/ui/components/Separator'
import { Button } from '@workspace/ui/components/Button'
import type { BsNumberFieldProps } from './Numberfield.types'

const normalizeLabelForPlaceholder = (label?: string) => {
    if (!label) return label
    const trimmed = label.trim()
    if (!trimmed) return ''
    return trimmed.toLocaleLowerCase('vi-VN')
}

interface InputContentProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError: boolean
    showStepper?: boolean
    minValue?: number
    maxValue?: number
    onChangeValue: (v: number | null) => void
    isDisabled?: boolean
}

const NumberFieldInputContent = React.forwardRef<HTMLInputElement, InputContentProps>(
    (
        {
            hasError,
            showStepper,
            minValue,
            maxValue,
            step = 1,
            value,
            onChangeValue,
            onBlur,
            className,
            placeholder,
            isDisabled,
            disabled,
            ...props
        },
        ref,
    ) => {
        const actualDisabled = isDisabled || disabled
        const handleIncrement = useCallback(() => {
            const current = Number(value || 0)
            const next = current + Number(step)
            if (typeof maxValue !== 'number' || next <= maxValue) {
                onChangeValue(next)
            }
        }, [value, step, maxValue, onChangeValue])

        const handleDecrement = useCallback(() => {
            const current = Number(value || 0)
            const next = current - Number(step)
            if (typeof minValue !== 'number' || next >= minValue) {
                onChangeValue(next)
            }
        }, [value, step, minValue, onChangeValue])

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value
                if (val === '') {
                    onChangeValue(null)
                } else {
                    const num = Number(val)
                    if (!isNaN(num)) {
                        onChangeValue(num)
                    }
                }
            },
            [onChangeValue],
        )

        return (
            <FieldGroup isInvalid={hasError} isDisabled={actualDisabled} className="p-0 overflow-hidden h-8">
                <input
                    ref={ref}
                    type="number"
                    className={cn(
                        'flex-1 h-full min-w-0 bg-transparent px-3 py-1.5 outline-none text-sm transition-colors',
                        'disabled:text-muted-foreground disabled:cursor-not-allowed',
                        'placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                        hasError && 'text-destructive placeholder:text-destructive/60',
                        className,
                    )}
                    placeholder={placeholder}
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChange={handleChange}
                    min={minValue}
                    max={maxValue}
                    step={step}
                    disabled={actualDisabled}
                    {...props}
                />
                {showStepper && (
                    <div className="flex items-center h-full relative pr-1">
                        <Separator orientation="vertical" className={cn('h-5 mx-1', hasError && 'bg-destructive/30')} />
                        <div className="flex flex-col h-full justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'h-3.5 w-5 p-0 hover:bg-transparent transition-colors active:scale-90',
                                    'group-focus-within/field:text-primary',
                                    hasError && 'text-destructive!',
                                )}
                                onPress={handleIncrement}
                                isDisabled={
                                    actualDisabled || (typeof maxValue === 'number' && Number(value || 0) >= maxValue)
                                }
                                excludeFromTabOrder
                            >
                                <ChevronUp className="size-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    'h-3.5 w-5 p-0 hover:bg-transparent transition-colors active:scale-90',
                                    'group-focus-within/field:text-primary',
                                    hasError && 'text-destructive!',
                                )}
                                onPress={handleDecrement}
                                isDisabled={
                                    actualDisabled || (typeof minValue === 'number' && Number(value || 0) <= minValue)
                                }
                                excludeFromTabOrder
                            >
                                <ChevronDown className="size-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </FieldGroup>
        )
    },
)
NumberFieldInputContent.displayName = 'NumberFieldInputContent'

const BsNumberField = React.forwardRef<HTMLInputElement, BsNumberFieldProps>(
    (
        {
            label,
            isRequired,
            errorMessage,
            name: fieldName,
            control,
            rules,
            showStepper = true,
            placeholder,
            containerClassName,
            minValue,
            maxValue,
            step = 1,
            className,
            isDisabled,
            disabled,
            formatOptions,
            ...inputProps
        },
        ref,
    ) => {
        const actualDisabled = isDisabled || disabled
        const { t } = useTranslation()
        const formContext = useFormContext()
        const resolvedControl = control ?? formContext?.control

        const mergedRules = useMemo(() => {
            const autoRules: RegisterOptions = {
                ...(isRequired
                    ? {
                          required: t('forms.validation.required', { label: label ?? t('common.field') }),
                      }
                    : {}),
                ...(typeof minValue === 'number'
                    ? {
                          min: {
                              value: minValue,
                              message: t('forms.validation.min', {
                                  label: label ?? t('common.field'),
                                  min: minValue,
                              }),
                          },
                      }
                    : {}),
                ...(typeof maxValue === 'number'
                    ? {
                          max: {
                              value: maxValue,
                              message: t('forms.validation.max', {
                                  label: label ?? t('common.field'),
                                  max: maxValue,
                              }),
                          },
                      }
                    : {}),
            }
            return { ...autoRules, ...(rules ?? {}) }
        }, [isRequired, minValue, maxValue, label, rules, t])

        const resolvedPlaceholder = useMemo(() => {
            if (actualDisabled) return ''
            return (
                placeholder ??
                (label
                    ? t('forms.placeholder.input', { label: normalizeLabelForPlaceholder(label) })
                    : t('common.input'))
            )
        }, [actualDisabled, placeholder, label, t])

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
                                    <NumberFieldInputContent
                                        ref={ref}
                                        hasError={hasError}
                                        showStepper={showStepper}
                                        minValue={minValue}
                                        maxValue={maxValue}
                                        step={step}
                                        placeholder={resolvedPlaceholder}
                                        value={field.value}
                                        onChangeValue={field.onChange}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        isDisabled={actualDisabled}
                                        {...inputProps}
                                    />
                                    {errMsg && <p className="text-xs text-destructive mt-1 font-medium">{errMsg}</p>}
                                </>
                            )
                        }}
                    />
                </div>
            )
        }

        const hasError = !!errorMessage
        return (
            <div className={containerClassName}>
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
                <NumberFieldInputContent
                    ref={ref}
                    hasError={hasError}
                    showStepper={showStepper}
                    minValue={minValue}
                    maxValue={maxValue}
                    step={step}
                    placeholder={resolvedPlaceholder}
                    value={inputProps.value as any}
                    onChangeValue={val => (inputProps as any).onChange?.(val)}
                    isDisabled={actualDisabled}
                    {...inputProps}
                />
                {errorMessage && <p className="text-xs text-destructive mt-1 font-medium">{errorMessage}</p>}
            </div>
        )
    },
)

BsNumberField.displayName = 'BsNumberField'

const BsNumberFieldCore = NumberFieldInputContent
const NumberFieldInput = NumberFieldInputContent
const NumberField = BsNumberField
const NumberFieldStepper = {}
const NumberFieldSteppers = {}

export {
    BsNumberField,
    BsNumberFieldCore,
    NumberField,
    NumberFieldInput,
    NumberFieldInputContent,
    NumberFieldStepper,
    NumberFieldSteppers,
}
