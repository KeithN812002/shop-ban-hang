'use client'

import { Check, Minus } from 'lucide-react'
import React from 'react'
import {
    Checkbox as AriaCheckbox,
    CheckboxGroup as AriaCheckboxGroup,
    CheckboxGroupProps as AriaCheckboxGroupProps,
    composeRenderProps,
    type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components'
import { Controller, useFormContext, type Control } from 'react-hook-form'

import { cn } from '@workspace/ui/lib/utils'

import { Label, labelVariants } from '@workspace/ui/components/Field'
import {
    getFieldHighlightCheckboxWrapperClass,
    getFieldHighlightLabelClass,
    getFieldHighlightMessageClass,
    type FieldHighlightVariant,
} from '@workspace/ui/lib/fieldHighlight'
import type { BsCheckboxGroupOption, BsCheckboxProps } from './Checkbox.types'

const CheckboxGroup = ({ className, ...props }: AriaCheckboxGroupProps) => {
    return <AriaCheckboxGroup className={cn('grid gap-2', className)} {...props} />
}

const Checkbox = ({ className, children, ...props }: AriaCheckboxProps) => (
    <AriaCheckbox
        className={composeRenderProps(className, className =>
            cn(
                'group/checkbox relative flex items-center gap-x-2 text-sm cursor-pointer',
                /* Disabled */
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
                labelVariants,
                className,
            ),
        )}
        isInvalid={(props as any)['aria-invalid']}
        {...props}
    >
        {composeRenderProps(children, (children, renderProps) => (
            <>
                <div
                    className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-[5px] border bg-background-secondary text-white ring-offset-background',
                        /* Focus Visible */
                        'group-data-[focus-visible]/checkbox:outline-none group-data-[focus-visible]/checkbox:ring-2 group-data-[focus-visible]/checkbox:ring-primary/40 group-data-[focus-visible]/checkbox:ring-offset-2',
                        /* Selected */
                        'group-data-[indeterminate]/checkbox:bg-primary group-data-[selected]/checkbox:bg-primary group-data-[indeterminate]/checkbox:border-black/10 group-data-[selected]/checkbox:border-black/10 group-data-[indeterminate]/checkbox:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] group-data-[selected]/checkbox:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]',
                        /* Selected Dark */
                        'dark:group-data-[indeterminate]/checkbox:border-none dark:group-data-[selected]/checkbox:border-none',
                        /* Disabled */
                        'group-data-[disabled]/checkbox:cursor-not-allowed group-data-[disabled]/checkbox:opacity-80',
                        /* Invalid */
                        'group-data-[invalid]/checkbox:border-destructive group-data-[invalid]/checkbox:group-data-[selected]/checkbox:bg-destructive group-data-[invalid]/checkbox:group-data-[selected]/checkbox:text-destructive-foreground',
                        /* Resets */
                        'focus:outline-none focus-visible:outline-none',
                    )}
                >
                    {renderProps.isIndeterminate ? (
                        <Minus className="size-4" />
                    ) : renderProps.isSelected ? (
                        <Check className="size-4" />
                    ) : null}
                </div>
                {children}
            </>
        ))}
    </AriaCheckbox>
)

function BsCheckboxGroupCore<T extends Record<string, any> = BsCheckboxGroupOption>({
    options,
    valueKey: vKey = 'id',
    labelKey: lKey = 'name',
    valueMode = 'simple',
    className,
    onChange,
    ...props
}: BsCheckboxProps<T>) {
    const optionMap = React.useMemo(() => {
        const map = new Map<string, T>()
        options.forEach(opt => map.set(String(opt[vKey]), opt))
        return map
    }, [options, vKey])

    const handleChange = React.useCallback(
        (values: string[]) => {
            if (!onChange) return
            if (valueMode === 'object') {
                onChange(values.map(v => optionMap.get(v)).filter(Boolean))
            } else {
                onChange(values)
            }
        },
        [onChange, valueMode, optionMap],
    )

    return (
        <CheckboxGroup {...props} onChange={handleChange}>
            <div className={cn('grid grid-cols-3 gap-4', className)}>
                {options.map(option => (
                    <Checkbox key={String(option[vKey])} value={String(option[vKey])}>
                        {String(option[lKey])}
                    </Checkbox>
                ))}
            </div>
        </CheckboxGroup>
    )
}

type BsCheckboxFieldProps<T extends Record<string, any> = BsCheckboxGroupOption> = BsCheckboxProps<T> & {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
}

function BsCheckboxGroup<T extends Record<string, any> = BsCheckboxGroupOption>({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    ...coreProps
}: BsCheckboxFieldProps<T>) {
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control
    const labelNode = label ? (
        <Label>
            {label} {isRequired && <span className="text-destructive">*</span>}
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
                                    ? Array.isArray(field.value)
                                        ? field.value.map((d: any) => String(d[vk]))
                                        : []
                                    : field.value,
                            onChange: (value: any) => field.onChange(value),
                        }
                        const errMsg = fieldState.error?.message || errorMessage
                        return (
                            <>
                                <BsCheckboxGroupCore<T> {...coreProps} {...(bindProps as any)} />
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
                <BsCheckboxGroupCore<T> {...coreProps} />
                {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            </div>
        )
    }

    return <BsCheckboxGroupCore<T> {...coreProps} />
}

type BsSingleCheckboxProps = AriaCheckboxProps & {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
    containerClassName?: string
    fieldHighlight?: FieldHighlightVariant
    highlightMessage?: string
}

function BsCheckbox({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    children,
    containerClassName,
    fieldHighlight,
    highlightMessage,
    ...props
}: BsSingleCheckboxProps) {
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control
    const labelNode = label ? (
        <Label
            className={cn('block h-5', fieldHighlight && !errorMessage && getFieldHighlightLabelClass(fieldHighlight))}
        >
            {label.trim() === '' ? <>&nbsp;</> : label}
            {isRequired && <span className="text-destructive">*</span>}
        </Label>
    ) : null

    const renderContent = (isSelected?: boolean, onChange?: (v: boolean) => void, isInvalid?: boolean) => {
        const errMsg = errorMessage
        const activeHighlight = !isInvalid && !errMsg ? fieldHighlight : undefined
        return (
            <div className={containerClassName}>
                {labelNode}
                <div
                    className={cn(
                        'flex items-center h-8',
                        activeHighlight && getFieldHighlightCheckboxWrapperClass(activeHighlight),
                    )}
                >
                    <Checkbox {...props} isSelected={isSelected} onChange={onChange} isInvalid={isInvalid}>
                        {children}
                    </Checkbox>
                </div>
                {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                {!errMsg && highlightMessage && activeHighlight && (
                    <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(activeHighlight))}>
                        {highlightMessage}
                    </p>
                )}
            </div>
        )
    }

    if (fieldName && resolvedControl) {
        return (
            <Controller
                name={fieldName}
                control={resolvedControl}
                render={({ field, fieldState }) => {
                    const errMsg = fieldState.error?.message || errorMessage
                    const activeHighlight = !fieldState.error && !errMsg ? fieldHighlight : undefined
                    return (
                        <div className={containerClassName}>
                            {labelNode}
                            <div
                                className={cn(
                                    'flex items-center h-8',
                                    activeHighlight && getFieldHighlightCheckboxWrapperClass(activeHighlight),
                                )}
                            >
                                <Checkbox
                                    {...props}
                                    isSelected={field.value}
                                    onChange={field.onChange}
                                    isInvalid={!!fieldState.error}
                                >
                                    {children}
                                </Checkbox>
                            </div>
                            {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                            {!errMsg && highlightMessage && activeHighlight && (
                                <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(activeHighlight))}>
                                    {highlightMessage}
                                </p>
                            )}
                        </div>
                    )
                }}
            />
        )
    }

    return renderContent(props.isSelected, props.onChange, props.isInvalid)
}

export { Checkbox, CheckboxGroup, BsCheckboxGroup, BsCheckbox }
