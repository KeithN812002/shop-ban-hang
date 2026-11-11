import { cn } from '@workspace/ui/lib/utils'
import { formatPrice } from '@/lib/format'

interface PriceProps {
    value: number
    original?: number | null
    discountPercent?: number | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-3xl' }

export function Price({ value, original, discountPercent, size = 'md', className }: PriceProps) {
    const hasDiscount = original != null && original > value
    const percent = discountPercent ?? (hasDiscount ? Math.round(((original - value) / original) * 100) : 0)
    return (
        <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
            <span className={cn('font-semibold text-brand-500', sizes[size])}>{formatPrice(value)}</span>
            {hasDiscount && (
                <span className={cn('text-gray-400 line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
                    {formatPrice(original)}
                </span>
            )}
            {hasDiscount && percent > 0 && (
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-600">-{percent}%</span>
            )}
        </span>
    )
}
