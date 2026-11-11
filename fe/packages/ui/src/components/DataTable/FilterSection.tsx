'use client'

import React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { LucideIcon } from 'lucide-react'

export interface FilterSectionProps {
    title: string
    icon: LucideIcon
    children: React.ReactNode
    className?: string
    gridClassName?: string
}

export const FilterSection = ({ title, icon: Icon, children, className, gridClassName }: FilterSectionProps) => {
    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                    <Icon className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">{title}</h3>
            </div>
            <div
                className={cn(
                    'grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 [&>*]:flex [&>*]:flex-col [&>*]:gap-0',
                    gridClassName,
                )}
            >
                {children}
            </div>
        </div>
    )
}
