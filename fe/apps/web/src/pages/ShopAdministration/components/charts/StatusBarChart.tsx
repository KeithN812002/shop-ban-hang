import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { ORDER_STATUSES, STATUS_META, type BadgeTone, type OrderStatus } from '../../constants'
import { formatCount } from '../../utils/format'

const BAR_CLASS: Record<BadgeTone, string> = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
}

interface StatusBarChartProps {
    counts: Partial<Record<OrderStatus, number>>
}

/** One horizontal bar per order status; each row carries its own number so no chart-only information is lost. */
export const StatusBarChart = memo(({ counts }: StatusBarChartProps) => {
    const { t } = useTranslation()
    const max = Math.max(1, ...ORDER_STATUSES.map(status => counts[status] ?? 0))

    return (
        <ul className="space-y-3">
            {ORDER_STATUSES.map(status => {
                const count = counts[status] ?? 0
                const meta = STATUS_META.order[status]
                return (
                    <li key={status} className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-3 text-sm">
                        <span className="truncate text-muted-foreground">{t(meta.label)}</span>
                        <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <span
                                className={cn('block h-full rounded-full', BAR_CLASS[meta.tone])}
                                style={{ width: `${(count / max) * 100}%` }}
                            />
                        </span>
                        <span className="text-right font-medium tabular-nums">{formatCount(count)}</span>
                    </li>
                )
            })}
        </ul>
    )
})

StatusBarChart.displayName = 'StatusBarChart'
