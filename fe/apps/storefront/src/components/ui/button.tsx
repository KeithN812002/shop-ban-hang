import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

export type ButtonVariant = 'primary' | 'outline' | 'soft' | 'ghost' | 'danger' | 'dark'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface StyleOptions {
    variant?: ButtonVariant
    size?: ButtonSize
    block?: boolean
    className?: string
}

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-800 hover:border-brand-500 hover:text-brand-600',
    soft: 'bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    dark: 'bg-gray-900 text-white hover:bg-gray-800',
}

const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    icon: 'size-9 justify-center',
}

/** Class string so links (`<Link className={buttonClass(...)}>`) can look like buttons. */
export const buttonClass = ({ variant = 'primary', size = 'md', block, className }: StyleOptions = {}): string =>
    cn(
        'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors',
        'disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
    )

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {
    loading?: boolean
    icon?: ReactNode
}

export function Button({
    variant,
    size,
    block,
    className,
    loading,
    icon,
    disabled,
    type = 'button',
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClass({ variant, size, block, className })}
            {...rest}
        >
            {loading ? <Loader2 className="animate-spin" aria-hidden /> : icon}
            {children}
        </button>
    )
}
