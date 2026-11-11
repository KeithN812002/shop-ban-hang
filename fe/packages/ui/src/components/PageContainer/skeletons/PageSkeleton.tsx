import { Skeleton } from '@workspace/ui/components/Skeleton'
import { TableListSkeleton } from './TableListSkeleton'
import { TableListActionsSkeleton } from './TableListActionsSkeleton'
import { PermissionSkeleton } from './PermissionSkeleton'
import { DataTableSkeleton } from './DataTableSkeleton'
import { SidebarTableSkeleton } from './SidebarTableSkeleton'
import { DashboardSkeleton } from './DashboardSkeleton'

export type PageLoadingType =
    | 'table-list'
    | 'table-list-actions'
    | 'table-only'
    | 'panel'
    | 'permission'
    | 'sidebar-table'
    | 'dashboard'

interface PageSkeletonProps {
    type: PageLoadingType
}

export const PageSkeleton = ({ type }: PageSkeletonProps) => {
    switch (type) {
        case 'table-list':
            return <TableListSkeleton />
        case 'table-list-actions':
            return <TableListActionsSkeleton />
        case 'table-only':
            return <DataTableSkeleton />
        case 'permission':
            return <PermissionSkeleton />
        case 'sidebar-table':
            return <SidebarTableSkeleton />
        case 'dashboard':
            return <DashboardSkeleton />
        case 'panel':
        default:
            return (
                <div className="w-full rounded-lg border bg-card p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-8 w-32 mt-4" />
                </div>
            )
    }
}
