'use client'

import React from 'react'

import { cn } from '@workspace/ui/lib/utils'

interface PageActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'end' | 'between'
}

const PageActionBar = ({ align = 'end', className, children, ...props }: PageActionBarProps) => {
    return (
        <div
            className={cn(
                'page-action-bar',
                'fixed bottom-0 right-0 left-0 z-50 flex min-h-[65px] items-center gap-3 border-t bg-background px-6 py-3',
                'sm:left-[var(--content-left)]',
                align === 'between' ? 'justify-between' : 'justify-end',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export { PageActionBar }
export type { PageActionBarProps }
