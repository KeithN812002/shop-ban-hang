'use client'

import { Circle } from 'lucide-react'
import React from 'react'
import {
    Radio as AriaRadio,
    RadioGroup as AriaRadioGroup,
    RadioGroupProps as AriaRadioGroupProps,
    RadioProps as AriaRadioProps,
    composeRenderProps,
} from 'react-aria-components'
import { Controller, type Control, useFormContext } from 'react-hook-form'
import { Label, labelVariants } from '@workspace/ui/components/Field'

import { cn } from '@workspace/ui/lib/utils'
import type { BsRadioGroupOption, BsRadioGroupProps } from './RadioGroup.types'

const RadioGroup = ({ className, ...props }: AriaRadioGroupProps) => {
    return (
        <AriaRadioGroup
            isInvalid={(props as any)['aria-invalid']}
            className={composeRenderProps(className, (className, renderProps) =>
                cn(
                    'group/radiogroup flex flex-col flex-wrap gap-2',
                    renderProps.orientation === 'horizontal' && 'flex-row items-center gap-4',
                    className,
                ),
            )}
            {...props}
        />
    )
}

const Radio = ({ className, children, ...props }: AriaRadioProps) => {
    return (
        <AriaRadio
            className={composeRenderProps(className, className =>
                cn(
                    'group/radio relative flex items-center gap-x-2 text-sm cursor-pointer',
                    /* Disabled */
                    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
                    labelVariants,
                    className,
                ),
            )}
            {...props}
        >
            {composeRenderProps(children, (children, renderProps) => (
                <>
                    <span
                        className={cn(
                            'flex aspect-square size-4 items-center justify-center rounded-full border bg-background-secondary text-white ring-offset-background',
                            /* Focus */
                            'group-data-[focused]/radio:outline-none',
                            /* Focus Visible */
                            'group-data-[focus-visible]/radio:ring-2 group-data-[focus-visible]/radio:ring-primary/40 group-data-[focus-visible]/radio:ring-offset-2',
                            /* Selected */
                            'group-data-[selected]/radio:bg-primary group-data-[selected]/radio:border-black/10 group-data-[selected]/radio:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
                            /* Selected Dark */
                            'dark:group-data-[selected]/radio:border-none',
                            /* Disabled */
                            'group-data-[disabled]/radio:cursor-not-allowed group-data-[disabled]/radio:opacity-50',
                            /* Invalid */
                            'group-data-[invalid]/radio:border-destructive',
                        )}
                    >
                        {renderProps.isSelected && <Circle className="size-1.5 fill-current text-current" />}
                    </span>
                    {children}
                </>
            ))}
        </AriaRadio>
    )
}

function BsRadioGroupCore<T extends Record<string, any> = BsRadioGroupOption>({
    options,
    valueKey: vKey = 'id',
    labelKey: lKey = 'name',
    valueMode = 'simple',
    className,
    onChange,
    ...props
}: BsRadioGroupProps<T>) {
    const optionMap = React.useMemo(() => {
        const map = new Map<string, T>()
        options.forEach(opt => map.set(String(opt[vKey]), opt))
        return map
    }, [options, vKey])

    const handleChange = React.useCallback(
        (value: string) => {
            if (!onChange) return
            if (valueMode === 'object') {
                onChange(optionMap.get(value) ?? null)
            } else {
                onChange(value)
            }
        },
        [onChange, valueMode, optionMap],
    )

    return (
        <RadioGroup {...props} onChange={handleChange}>
            {options.map(option => (
                <Radio
                    key={String(option[vKey])}
                    value={String(option[vKey])}
                    isDisabled={option.isDisabled || option.disabled}
                >
                    {String(option[lKey])}
                </Radio>
            ))}
        </RadioGroup>
    )
}

type BsRadioFieldProps<T extends Record<string, any> = BsRadioGroupOption> = BsRadioGroupProps<T> & {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
}

function BsRadioGroup<T extends Record<string, any> = BsRadioGroupOption>({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    ...coreProps
}: BsRadioFieldProps<T>) {
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const labelNode = label ? (
        <Label className="flex items-center gap-1 w-fit max-w-full overflow-hidden">
            <span className="truncate min-w-0" title={label}>
                {label}
            </span>
            {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
        </Label>
    ) : null

    if (fieldName && resolvedControl) {
        const valMode = coreProps.valueMode ?? 'simple'
        const vk = coreProps.valueKey ?? 'id'

        return (
            <div>
                {labelNode}
                <Controller
                    name={fieldName}
                    control={resolvedControl}
                    render={({ field, fieldState }) => {
                        const bindProps: Record<string, any> = {
                            value:
                                valMode === 'object'
                                    ? field.value?.[vk] != null
                                        ? String(field.value[vk])
                                        : field.value
                                    : field.value,
                            onChange: (value: any) => field.onChange(value),
                        }
                        const errMsg = fieldState.error?.message || errorMessage
                        return (
                            <>
                                <BsRadioGroupCore<T> {...coreProps} {...(bindProps as any)} />
                                {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                            </>
                        )
                    }}
                />
            </div>
        )
    }

    if (label || errorMessage) {
        return (
            <div>
                {labelNode}
                <BsRadioGroupCore<T> {...coreProps} />
                {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            </div>
        )
    }

    return <BsRadioGroupCore<T> {...coreProps} />
}

export { Radio, RadioGroup, BsRadioGroup }
