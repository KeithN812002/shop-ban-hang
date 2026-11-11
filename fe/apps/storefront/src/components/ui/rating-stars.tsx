import { Star } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

interface RatingStarsProps {
    value: number
    size?: number
    className?: string
    /** Show the numeric value next to the stars */
    showValue?: boolean
}

function StarRow({ size, filled }: { size: number; filled: boolean }) {
    return (
        <span className="flex shrink-0">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    style={{ width: size, height: size }}
                    className={filled ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                    aria-hidden
                />
            ))}
        </span>
    )
}

/** Fractional star rating (e.g. 4.3 fills 86% of the row). */
export function RatingStars({ value, size = 14, className, showValue }: RatingStarsProps) {
    const percent = Math.max(0, Math.min(100, (value / 5) * 100))
    return (
        <span
            className={cn('inline-flex items-center gap-1', className)}
            role="img"
            aria-label={`${value.toFixed(1)} / 5`}
        >
            <span className="relative inline-flex">
                <StarRow size={size} filled={false} />
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${percent}%` }}>
                    <StarRow size={size} filled />
                </span>
            </span>
            {showValue && <span className="text-xs font-medium text-gray-700">{value.toFixed(1)}</span>}
        </span>
    )
}

interface RatingInputProps {
    value: number
    onChange: (value: number) => void
    label: string
}

/** Clickable 1..5 star selector. */
export function RatingInput({ value, onChange, label }: RatingInputProps) {
    return (
        <div role="radiogroup" aria-label={label} className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star}`}
                    onClick={() => onChange(star)}
                    className="rounded p-0.5"
                >
                    <Star
                        className={cn('size-7', star <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
                        aria-hidden
                    />
                </button>
            ))}
        </div>
    )
}
