import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { clamp } from '@/lib/format'

interface QuantityInputProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    disabled?: boolean
    className?: string
}

export function QuantityInput({ value, onChange, min = 1, max = 999, disabled, className }: QuantityInputProps) {
    const { t } = useTranslation()
    const set = (next: number) => {
        const safe = clamp(Number.isFinite(next) ? next : min, min, Math.max(min, max))
        if (safe !== value) onChange(safe)
    }
    const btn = 'inline-flex size-8 items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40'
    return (
        <div className={cn('inline-flex items-center overflow-hidden rounded-md border bg-white', className)}>
            <button
                type="button"
                className={btn}
                disabled={disabled || value <= min}
                onClick={() => set(value - 1)}
                aria-label={t('common.decrease')}
            >
                <Minus className="size-3.5" />
            </button>
            <input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={value}
                disabled={disabled}
                onChange={event => set(parseInt(event.target.value, 10))}
                aria-label={t('common.quantity')}
                className="h-8 w-12 [appearance:textfield] border-x text-center text-sm focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
                type="button"
                className={btn}
                disabled={disabled || value >= max}
                onClick={() => set(value + 1)}
                aria-label={t('common.increase')}
            >
                <Plus className="size-3.5" />
            </button>
        </div>
    )
}
