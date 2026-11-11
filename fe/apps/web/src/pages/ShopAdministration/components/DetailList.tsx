import { memo, type ReactNode } from 'react'
import { cn } from '@workspace/ui/lib/utils'

export interface DetailItem {
    label: string
    value?: ReactNode
    /** Spans both columns (long text such as addresses and reasons). */
    wide?: boolean
}

interface DetailListProps {
    items: DetailItem[]
    columns?: 1 | 2
    className?: string
}

const EMPTY_VALUE = '—'

/** Read-only label-over-value block (`dl`/`dt`/`dd`); empty values render as an em dash. */
export const DetailList = memo(({ items, columns = 2, className }: DetailListProps) => (
    <dl className={cn('grid gap-x-6', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)}>
        {items.map(({ label, value, wide }) => (
            <div key={label} className={cn('border-b py-3', wide && 'sm:col-span-2')}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium break-words">
                    {value === undefined || value === null || value === '' ? EMPTY_VALUE : value}
                </dd>
            </div>
        ))}
    </dl>
))

DetailList.displayName = 'DetailList'
