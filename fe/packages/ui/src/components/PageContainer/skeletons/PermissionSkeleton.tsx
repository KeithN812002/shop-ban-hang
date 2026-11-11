import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'

const ROOT_WIDTHS = ['w-36', 'w-32', 'w-48', 'w-44']

export const PermissionSkeleton = () => (
    <div className="flex-1 flex gap-4 min-h-0 -mb-5 w-full">
        {/* Left Panel */}
        <div className="w-[300px] shrink-0 rounded-xl border bg-card flex flex-col gap-0 overflow-hidden p-1">
            <div className="scrollbar-float scrollbar-divided overflow-y-hidden -mx-1 min-h-14 border-b py-3 pl-4 pr-[5px]">
                <Skeleton className="h-8 w-full rounded-sm" />
            </div>
            <div className="scrollbar-float scrollbar-divided overflow-y-hidden -mx-1 flex flex-1 flex-col py-3 pl-4 pr-[5px]">
                {ROOT_WIDTHS.map((w, i) => (
                    <div key={i} className="flex h-8 items-center gap-2 px-2">
                        <Skeleton className="size-4 shrink-0 rounded-sm" />
                        <Skeleton className={cn('h-4', w)} />
                        <span className="ml-auto flex w-5 shrink-0 justify-center">
                            <Skeleton className="size-4 rounded-sm" />
                        </span>
                    </div>
                ))}
            </div>
            <div className="scrollbar-float scrollbar-divided overflow-y-hidden -mx-1 shrink-0 border-t pt-3 pb-2 pl-4 pr-[5px]">
                <Skeleton className="h-8 w-full" />
            </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 rounded-xl border bg-card flex flex-col items-center justify-center gap-4 p-1">
            <Skeleton className="size-12 rounded-lg" />
            <Skeleton className="h-4 w-60" />
        </div>
    </div>
)
