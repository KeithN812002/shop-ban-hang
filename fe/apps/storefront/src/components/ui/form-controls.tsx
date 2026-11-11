import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@workspace/ui/lib/utils'

const controlBase =
    'w-full rounded-md border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors ' +
    'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-100'

interface InvalidProp {
    invalid?: boolean
}

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & InvalidProp) {
    return (
        <input
            aria-invalid={invalid || undefined}
            className={cn(controlBase, 'h-10', invalid ? 'border-red-500' : 'border-gray-300', className)}
            {...rest}
        />
    )
}

export function Textarea({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp) {
    return (
        <textarea
            aria-invalid={invalid || undefined}
            className={cn(controlBase, 'py-2', invalid ? 'border-red-500' : 'border-gray-300', className)}
            {...rest}
        />
    )
}

export function Select({ className, invalid, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & InvalidProp) {
    return (
        <select
            aria-invalid={invalid || undefined}
            className={cn(controlBase, 'h-10', invalid ? 'border-red-500' : 'border-gray-300', className)}
            {...rest}
        />
    )
}

interface FieldProps {
    label: string
    error?: string
    hint?: string
    required?: boolean
    className?: string
    children: ReactNode
}

/** Label + control + error. The control is nested in the <label> so the association is implicit. */
export function Field({ label, error, hint, required, className, children }: FieldProps) {
    return (
        <label className={cn('block space-y-1', className)}>
            <span className="text-sm font-medium text-gray-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </span>
            {children}
            {hint && !error && <span className="block text-xs text-gray-500">{hint}</span>}
            {error && (
                <span role="alert" className="block text-xs text-red-600">
                    {error}
                </span>
            )}
        </label>
    )
}
