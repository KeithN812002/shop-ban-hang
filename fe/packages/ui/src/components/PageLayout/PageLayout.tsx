'use client'

import React from 'react'
import { cn } from '@workspace/ui/lib/utils'

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

const PageLayout = ({ className, children, ...props }: PageLayoutProps) => {
    return (
        <div className={cn('w-full h-screen flex flex-col p-4 space-y-4', className)} {...props}>
            {children}
        </div>
    )
}

const PageContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={cn('flex-1 flex gap-4 min-h-0', className)} {...props}>
            {children}
        </div>
    )
}

export { PageLayout, PageContent }
