import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { MediaName } from '../../components/MediaName'

export interface TopListItem {
    key: string
    name: string
    imageUrl?: string | null
    /** Right-aligned headline figure (revenue / GMV). */
    primary: string
    /** Muted figure under it (units sold / order count). */
    secondary?: string
}

interface TopListProps {
    items: TopListItem[]
    icon: LucideIcon
}

/** Ranked list used by the top stores / products / categories blocks. */
export const TopList = memo(({ items, icon }: TopListProps) => {
    if (items.length === 0) return <EmptyState kind="no-records" variant="compact" />

    return (
        <ol className="divide-y">
            {items.map((item, index) => (
                <li key={item.key} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                        {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <MediaName name={item.name} imageUrl={item.imageUrl} icon={icon} />
                    </div>
                    <div className="shrink-0 text-right">
                        <div className="text-sm font-medium tabular-nums">{item.primary}</div>
                        {item.secondary && <div className="text-xs text-muted-foreground">{item.secondary}</div>}
                    </div>
                </li>
            ))}
        </ol>
    )
})

TopList.displayName = 'TopList'
