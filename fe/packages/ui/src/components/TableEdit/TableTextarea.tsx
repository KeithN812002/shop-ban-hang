'use client'

import React from 'react'
import { TextArea } from '@workspace/ui/components/Textfield'
import { cn } from '@workspace/ui/lib/utils'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { hasHtmlOrScript } from '@workspace/ui/lib/validators'

interface TableTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
    value?: string
    onChange?: (value: string) => void
    isInvalid?: boolean
    isDisabled?: boolean
    isClearable?: boolean
    className?: string
}

const getIconColorClass = (hasError: boolean) =>
    cn(
        'size-3.5 transition-colors',
        hasError ? 'text-destructive' : 'text-muted-foreground group-focus-within/table-textarea:text-primary',
    )

export const TableTextarea = React.forwardRef<HTMLTextAreaElement, TableTextareaProps>(
    ({ value, onChange, isInvalid, isDisabled, isClearable = true, className, ...props }, ref) => {
        const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

        // Combine refs
        React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

        const adjustHeight = React.useCallback(() => {
            const node = textareaRef.current
            if (node) {
                node.style.height = 'auto' // Reset to auto to get correct scrollHeight
                const scrollHeight = node.scrollHeight
                if (scrollHeight > 32) {
                    node.style.height = `${scrollHeight}px`
                } else {
                    node.style.height = '32px'
                }
            }
        }, [])

        React.useEffect(() => {
            adjustHeight()
        }, [value, adjustHeight])

        const showClear = isClearable && !isDisabled && value && value.length > 0

        return (
            <div className="relative group/table-textarea w-full flex items-center">
                <TextArea
                    ref={textareaRef}
                    value={value ?? ''}
                    disabled={isDisabled}
                    aria-invalid={isInvalid}
                    onChange={e => {
                        onChange?.(e.target.value)
                        adjustHeight()
                    }}
                    rows={1}
                    className={cn(
                        'min-h-0! px-2 py-1.5 text-[13px] resize-none overflow-hidden transition-[height] duration-100', // Density for table usage
                        isClearable && 'pr-8',
                        className,
                    )}
                    {...props}
                />
                {showClear && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => {
                            onChange?.('')
                            setTimeout(adjustHeight, 0)
                        }}
                    >
                        <X className={getIconColorClass(!!isInvalid)} />
                    </Button>
                )}
            </div>
        )
    },
)

TableTextarea.displayName = 'TableTextarea'

interface BsTableTextareaProps extends TableTextareaProps {
    name: string
    control?: any
    rules?: any
    isRequired?: boolean
    label?: string
}

export const BsTableTextarea = ({ name, control, rules, isRequired, label, ...props }: BsTableTextareaProps) => {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

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
                        <TableTextarea
                            {...props}
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
