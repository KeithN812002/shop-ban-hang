import { Skeleton } from '@workspace/ui/components/Skeleton'

const KPI_CARDS = 8
const TOP_LIST_ROWS = 5

/** Filter bar, KPI card grid, a chart row (2/3 + 1/3) and a row of three ranked lists. */
export const DashboardSkeleton = () => (
    <div className="w-full space-y-4">
        {/* Filter bar */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full rounded-md" />
                </div>
                <div className="flex gap-2 lg:col-start-3">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: KPI_CARDS }, (_, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-xl border bg-card px-4 py-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-2/3" />
                </div>
            ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-4 lg:col-span-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-[280px] w-full rounded-md" />
            </div>
            <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-[280px] w-full rounded-md" />
            </div>
        </div>

        {/* Ranked lists */}
        <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, card) => (
                <div key={card} className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="divide-y">
                        {Array.from({ length: TOP_LIST_ROWS }, (_, row) => (
                            <div key={row} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                                <Skeleton className="h-5 w-5 shrink-0" />
                                <Skeleton className="size-8 shrink-0 rounded" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-16 shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
)
