import type { ReactNode } from 'react'
import { cn } from '@workspace/ui/lib/utils'

interface KpiCardProps {
    label: string
    value: ReactNode
    icon?: ReactNode
    /** Hover affordance for cards wrapped in a <Link> (e.g. "to do" counters). */
    interactive?: boolean
    highlight?: boolean
}

export function KpiCard({ label, value, icon, interactive, highlight }: KpiCardProps) {
    return (
        <div
            className={cn(
                'h-full rounded-xl border bg-white p-4',
                interactive && 'transition-colors hover:border-brand-400 hover:bg-brand-50/40',
            )}
        >
            <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                <span>{label}</span>
                {icon && <span className="text-gray-400 [&_svg]:size-4">{icon}</span>}
            </div>
            <div className={cn('mt-2 text-2xl font-bold', highlight ? 'text-brand-600' : 'text-gray-900')}>{value}</div>
        </div>
    )
}
