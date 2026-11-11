'use client'

import React from 'react'

import { cn } from '@workspace/ui/lib/utils'

const PAGE_SCROLL_AREA = 'min-h-0 flex-1 overflow-y-auto scrollbar-hide pb-4'
const PAGE_SCROLL_AREA_BLEED = '-mr-6 pr-6'

interface PageScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    bleed?: boolean
    ref?: React.Ref<HTMLDivElement>
}

const PageScrollArea = ({ bleed = true, className, children, ...props }: PageScrollAreaProps) => {
    return (
        <div className={cn(PAGE_SCROLL_AREA, bleed && PAGE_SCROLL_AREA_BLEED, className)} {...props}>
            {children}
        </div>
    )
}

export { PageScrollArea, PAGE_SCROLL_AREA, PAGE_SCROLL_AREA_BLEED }
export type { PageScrollAreaProps }
