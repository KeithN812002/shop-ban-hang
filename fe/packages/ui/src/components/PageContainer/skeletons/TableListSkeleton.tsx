import { Skeleton } from '@workspace/ui/components/Skeleton'
import { DataTableSkeleton } from './DataTableSkeleton'

export const TableListSkeleton = () => (
    <div className="w-full space-y-4">
        {/* Filter Skeleton */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex items-end gap-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            </div>
        </div>

        <DataTableSkeleton scrollHeight="max(320px, calc(100dvh - 340px))" />
    </div>
)
