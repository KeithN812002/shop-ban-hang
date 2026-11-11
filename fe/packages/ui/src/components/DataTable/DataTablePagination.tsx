'use client'

import React from 'react'
import { Pagination, PaginationPageSizeSelector } from '@workspace/ui/components/Pagination'
import { cn } from '@workspace/ui/lib/utils'

const JUMP_TO_PAGE_THRESHOLD = 10

export interface DataTablePaginationProps {
    pageNumber: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    paginationSummary?: string
    itemsPerPageLabel?: string
    goToPageLabel?: string
    className?: string
    startItem?: number
    endItem?: number
    isDisabled?: boolean
}

export const DataTablePagination = ({
    pageNumber,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
    onPageSizeChange,
    paginationSummary,
    itemsPerPageLabel,
    goToPageLabel,
    className,
    isDisabled,
}: DataTablePaginationProps) => {
    const [draftPage, setDraftPage] = React.useState('')
    const commitDraftPage = () => {
        const page = Number(draftPage)
        setDraftPage('')
        if (!draftPage || !Number.isFinite(page)) return
        const target = Math.min(Math.max(Math.trunc(page), 1), totalPages)
        if (target !== pageNumber) onPageChange(target)
    }

    if (totalItems <= 0) return null

    return (
        <div className={cn('mt-2 flex items-center justify-end', className)}>
            <div className="flex items-center gap-3">
                {totalPages > JUMP_TO_PAGE_THRESHOLD && (
                    <label className="flex items-center gap-1.5 border-r border-border pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {goToPageLabel}
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={totalPages}
                            value={draftPage}
                            disabled={isDisabled}
                            onChange={event => setDraftPage(event.target.value)}
                            onBlur={() => commitDraftPage()}
                            onKeyDown={event => {
                                if (event.key === 'Enter') commitDraftPage()
                            }}
                            className="h-8 w-14 rounded-md border border-input bg-background px-2 text-center text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                    </label>
                )}
                <div className="text-sm text-foreground">{paginationSummary}</div>
                <Pagination value={pageNumber} pageCount={totalPages} onChange={onPageChange} isDisabled={isDisabled} />
                <PaginationPageSizeSelector
                    value={pageSize}
                    onChange={onPageSizeChange}
                    label={itemsPerPageLabel}
                    isDisabled={isDisabled}
                />
            </div>
        </div>
    )
}
