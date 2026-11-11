'use client'

import { cn } from '@workspace/ui/lib/utils'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsSelectCore } from '../Select/Select'

export interface TableSelectOption {
    value: string
    label: string
    disabled?: boolean
}

interface TableSelectProps {
    value?: string
    onChange?: (value: string) => void
    options?: readonly any[]
    valueKey?: string
    labelKey?: string
    placeholder?: string
    isInvalid?: boolean
    isDisabled?: boolean
    className?: string
    isSearchable?: boolean
    isClearable?: boolean
}

export const TableSelect = ({
    value,
    onChange,
    options = [],
    valueKey = 'value',
    labelKey = 'label',
    placeholder,
    isInvalid,
    isDisabled,
    className,
    ...props
}: TableSelectProps) => {
    return (
        <BsSelectCore
            selectedValue={value}
            onChange={onChange}
            options={options}
            valueKey={valueKey}
            labelKey={labelKey}
            isDisabled={isDisabled}
            aria-invalid={isInvalid}
            placeholder={placeholder}
            popoverPlacement="bottom start"
            className={cn('h-8 min-h-8!', className)}
            {...props}
        />
    )
}

TableSelect.displayName = 'TableSelect'

interface BsTableSelectProps extends TableSelectProps {
    name: string
    control?: any
    rules?: any
    isRequired?: boolean
    label?: string
}

export const BsTableSelect = ({ name, control, rules, isRequired, label, ...props }: BsTableSelectProps) => {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const autoRules = {
        ...(isRequired ? { required: t('forms.validation.required', { label: label ?? t('common.field') }) } : {}),
        ...(rules ?? {}),
    }

    return (
        <Controller
            name={name}
            control={resolvedControl}
            rules={autoRules}
            render={({ field, fieldState }) => {
                const error = fieldState.error
                return (
                    <div className="relative flex flex-col justify-center min-h-[40px]">
                        <TableSelect
                            {...props}
                            value={field.value}
                            onChange={field.onChange}
                            isInvalid={!!error}
                            isDisabled={props.isDisabled}
                        />
                        {error && (
                            <span className="absolute top-[85%] left-1 text-[11px] text-destructive font-medium leading-tight mt-1 animate-in fade-in slide-in-from-top-1 duration-200 z-10">
                                {error.message}
                            </span>
                        )}
                    </div>
                )
            }}
        />
    )
}
