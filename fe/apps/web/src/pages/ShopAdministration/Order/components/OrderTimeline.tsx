import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/format'
import type { OrderHistoryEntry } from '../../types'

const SOURCE_LABEL: Record<NonNullable<OrderHistoryEntry['source']>, ParseKeys> = {
    BUYER: 'shopAdmin.order.source.BUYER',
    SELLER: 'shopAdmin.order.source.SELLER',
    SHIPPER: 'shopAdmin.order.source.SHIPPER',
    ADMIN: 'shopAdmin.order.source.ADMIN',
    SYSTEM: 'shopAdmin.order.source.SYSTEM',
}

interface OrderTimelineProps {
    history: OrderHistoryEntry[]
}

/** Status history of an order, oldest first. */
export const OrderTimeline = memo(({ history }: OrderTimelineProps) => {
    const { t } = useTranslation()
    const ordered = useMemo(
        () => [...history].sort((a, b) => (a.createdDate ?? '').localeCompare(b.createdDate ?? '')),
        [history],
    )
    if (ordered.length === 0) {
        return <p className="text-sm text-muted-foreground">{t('shopAdmin.order.noHistory')}</p>
    }
    return (
        <ol className="relative ml-2 space-y-4 border-l pl-5">
            {ordered.map(entry => (
                <li key={entry.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{entry.action}</span>
                        {entry.statusBefore && <StatusBadge domain="order" status={entry.statusBefore} />}
                        {entry.statusBefore && entry.statusAfter && (
                            <span className="text-muted-foreground" aria-hidden>
                                &rarr;
                            </span>
                        )}
                        {entry.statusAfter && <StatusBadge domain="order" status={entry.statusAfter} />}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(entry.createdDate)}
                        {entry.actor && ` · ${entry.actor}`}
                        {entry.source && ` (${t(SOURCE_LABEL[entry.source])})`}
                    </div>
                    {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
                </li>
            ))}
        </ol>
    )
})

OrderTimeline.displayName = 'OrderTimeline'
