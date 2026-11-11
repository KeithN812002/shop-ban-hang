'use client'

import React from 'react'
import type { TFunction } from 'i18next'
import { Card } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { Search, RotateCcw } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { useFormContext } from 'react-hook-form'
import { trimFormStrings } from './useFilterTags'

export interface FilterBarProps {
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
    onReset: () => void
    children: React.ReactNode
    isPending?: boolean
    t?: TFunction
    className?: string
    gridClassName?: string
    advancedFilter?: React.ReactNode
    activeFilters?: React.ReactNode
    submitLabel?: string
    submitIcon?: React.ComponentType<{ className?: string }>
}

export const FilterBar = ({
    onSubmit,
    onReset,
    children,
    isPending,
    t,
    className,
    gridClassName,
    advancedFilter,
    activeFilters,
    submitLabel,
    submitIcon: SubmitIcon = Search,
}: FilterBarProps) => {
    const formContext = useFormContext()
    const handleSubmit = (e?: React.BaseSyntheticEvent) => {
        trimFormStrings(formContext)
        return onSubmit(e)
    }
    const childArray = React.Children.toArray(children)
    const firstChild = childArray[0]
    const otherChildren = childArray.slice(1)

    return (
        <div className="flex flex-col gap-4">
            <Card className={cn('p-4 shadow-sm', className)}>
                <form
                    onSubmit={handleSubmit}
                    className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end', gridClassName)}
                >
                    {advancedFilter ? (
                        <div className="flex items-end gap-2">
                            {advancedFilter}
                            <div className="flex-1">{firstChild}</div>
                        </div>
                    ) : (
                        firstChild
                    )}

                    {otherChildren}

                    <div className="flex gap-2">
                        <Button type="submit" className="h-8 px-3" isDisabled={isPending}>
                            <SubmitIcon className="size-3.5" />
                            {submitLabel || (t ? t('common.search') : 'common.search')}
                        </Button>
                        <Button variant="outline" className="h-8 px-3" onPress={onReset} isDisabled={isPending}>
                            <RotateCcw className="size-3.5" />
                            {t ? t('common.reset') : 'common.reset'}
                        </Button>
                    </div>
                </form>
            </Card>
            {activeFilters}
        </div>
    )
}
