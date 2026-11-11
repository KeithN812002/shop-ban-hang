import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { DataTableSkeleton } from './DataTableSkeleton'

const ITEM_WIDTHS = ['w-32', 'w-20', 'w-40', 'w-16', 'w-28', 'w-24']

export const SidebarTableSkeleton = () => (
    <div className="flex-1 flex gap-4 min-h-0 -mb-3 w-full">
        {/* Left: sidebar list (search + items, no footer button) */}
        <div className="w-[300px] shrink-0 rounded-xl border bg-card flex flex-col overflow-hidden">
            <div className="min-h-14 px-3 py-3 border-b">
                <Skeleton className="h-8 w-full rounded-sm" />
            </div>
            <div className="flex-1 p-2 flex flex-col gap-1 overflow-hidden">
                {ITEM_WIDTHS.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 h-10">
                        <Skeleton className="size-4 shrink-0 rounded-sm" />
                        <Skeleton className={cn('h-4', w)} />
                    </div>
                ))}
            </div>
        </div>

        {/* Right: filter (2 fields + 1 checkbox + 2 buttons) + table */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2 flex-1 min-w-[160px]">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                    <div className="space-y-2 flex-1 min-w-[160px]">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                    <div className="flex items-center gap-2 pb-1">
                        <Skeleton className="size-4 shrink-0 rounded-sm" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                </div>
            </div>

            <DataTableSkeleton scrollHeight="max(320px, calc(100dvh - 340px))" />
        </div>
    </div>
)
