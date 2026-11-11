'use client'

import React from 'react'

import { cn } from '@workspace/ui/lib/utils'
import { PageHeader } from '@workspace/ui/components/PageHeader'
import { Skeleton } from '@workspace/ui/components/Skeleton'

import { PageSkeleton, type PageLoadingType } from './skeletons/PageSkeleton'
export type { PageLoadingType }

interface PageContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode
    titleStyle?: React.CSSProperties
    description?: string
    meta?: React.ReactNode
    headerActions?: React.ReactNode
    children?: React.ReactNode
    isLoading?: boolean
    titleLoading?: boolean
    loadingType?: PageLoadingType
    layout?: 'row' | 'col'
}

const PageContainer = ({
    className,
    title,
    titleStyle,
    description,
    meta,
    headerActions,
    children,
    isLoading,
    titleLoading,
    loadingType = 'panel',
    layout = 'col',
    ...props
}: PageContainerProps) => {
    return (
        <div className={cn('w-full space-y-4', className)} {...props}>
            <PageHeader
                title={titleLoading ? <Skeleton className="h-8 w-96 max-w-full rounded-md" /> : title}
                titleStyle={titleStyle}
                description={description}
                meta={titleLoading ? undefined : meta}
            >
                {headerActions}
            </PageHeader>
            <div
                className={cn(
                    'flex-1 flex min-h-0 w-full',
                    layout === 'col' ? 'flex-col gap-4 pb-3' : 'gap-4',
                    // Only when the whole body is one scroll region: DashboardLayout's `p-6`
                    // sits outside it, so content stops short of the viewport and leaves a dead
                    // strip. Bleed through that padding and hand it to the scroll region, where
                    // it reads as breathing room at the end of the scroll. The -mb-6/pb-6 pair
                    // must stay in step with that `p-6`.
                    // `:only-child` keeps this off pages that pair the scroll region with a
                    // pinned footer — those reserve their own clearance and must not extend
                    // under it. Matching on the class means a body scrolling via `overflow-auto`
                    // instead opts out; page-level scroll regions all use `overflow-y-auto`.
                    'has-[.page-action-bar]:pb-[41px]',
                    'has-[>.overflow-y-auto:only-child]:pb-0',
                    'has-[>.overflow-y-auto:only-child]:-mb-6',
                    '[&>.overflow-y-auto:only-child]:pb-6',
                )}
            >
                {isLoading ? <PageSkeleton type={loadingType} /> : children}
            </div>
        </div>
    )
}

export { PageContainer }
