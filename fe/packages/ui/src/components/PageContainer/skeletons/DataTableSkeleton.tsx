import React from 'react'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { readTableDensity, type TableDensity } from '../../DataTable/columnSettingsStorage'
import { useFitHeight } from '../../DataTable/useFitHeight'

const DATA_COLUMN_WIDTHS = [180, 386, 180, 258, 295, 180, 180, 231, 253, 180, 180, 180]
const INDEX_COLUMN_WIDTH = 66
const CHECKBOX_COLUMN_WIDTH = 57

const HEADER_CELL = 'flex h-11 shrink-0 items-center border-r border-border/50 px-3'
const BODY_CELL = 'flex shrink-0 items-center border-r border-b border-border/40 px-3'

const ROW_HEIGHT: Record<TableDensity, number> = { compact: 33, normal: 45, comfortable: 53 }

const SCROLLBAR_SIZE = 11
const MIN_THUMB_SIZE = 32

interface ScrollRatio {
    x: number | null
    y: number | null
}

const thumbSize = (ratio: number) => `max(${MIN_THUMB_SIZE}px, ${ratio * 100}%)`

interface DataTableSkeletonProps {
    scrollHeight?: string
    rows?: number
    selectable?: boolean
    actionWidth?: number
    columnWidths?: number[]
}

export const DataTableSkeleton = ({
    scrollHeight,
    rows = scrollHeight ? 20 : 10,
    selectable = false,
    actionWidth = 88,
    columnWidths = DATA_COLUMN_WIDTHS,
}: DataTableSkeletonProps) => {
    const tableRef = React.useRef<HTMLDivElement>(null)
    const bodyRef = React.useRef<HTMLDivElement>(null)
    const [scrollRatio, setScrollRatio] = React.useState<ScrollRatio>({ x: null, y: null })
    const fitHeight = useFitHeight(tableRef, !!scrollHeight)
    const leadWidth = selectable ? CHECKBOX_COLUMN_WIDTH : INDEX_COLUMN_WIDTH
    const rowHeight = ROW_HEIGHT[readTableDensity()]
    const actionIcons = Math.max(1, Math.floor((actionWidth - 24) / 28))
    const contentWidth = leadWidth + columnWidths.reduce((sum, width) => sum + width, 0) + actionWidth
    const contentHeight = rows * rowHeight

    React.useLayoutEffect(() => {
        const table = tableRef.current
        const body = bodyRef.current
        if (!table || !body) return

        const measure = () => {
            const viewHeight = body.clientHeight
            const y = contentHeight - viewHeight > 1 ? viewHeight / contentHeight : null
            const viewWidth = table.clientWidth - (y === null ? 0 : SCROLLBAR_SIZE)
            const next: ScrollRatio = { x: contentWidth - viewWidth > 1 ? viewWidth / contentWidth : null, y }
            setScrollRatio(prev => (prev.x === next.x && prev.y === next.y ? prev : next))
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(table)
        observer.observe(body)
        return () => observer.disconnect()
    }, [contentWidth, contentHeight])

    const renderLead = (isHeader: boolean) => (
        <div
            className={cn(isHeader ? HEADER_CELL : BODY_CELL, 'justify-center')}
            style={{ width: leadWidth, height: isHeader ? undefined : rowHeight }}
        >
            {selectable ? (
                <Skeleton className="size-4 rounded-sm" />
            ) : (
                <Skeleton className={cn(isHeader ? 'h-3 w-7' : 'h-4 w-4')} />
            )}
        </div>
    )

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                ref={tableRef}
                className="flex flex-col overflow-hidden rounded-md border bg-background"
                style={{ maxHeight: fitHeight === null ? scrollHeight : `${fitHeight}px` }}
            >
                <div className="flex bg-muted">
                    <div className="flex min-w-0 flex-1 overflow-hidden">
                        {renderLead(true)}
                        {columnWidths.map((width, i) => (
                            <div key={i} className={cn(HEADER_CELL, 'justify-center')} style={{ width }}>
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                    <div
                        className="flex h-11 shrink-0 items-center justify-center border-l border-border px-3"
                        style={{ width: actionWidth }}
                    >
                        <Skeleton className="size-4 rounded-sm" />
                    </div>
                    {scrollRatio.y !== null && <div className="shrink-0" style={{ width: SCROLLBAR_SIZE }} />}
                </div>
                <div ref={bodyRef} className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="min-w-0 flex-1 overflow-hidden">
                        {Array.from({ length: rows }).map((_, i) => (
                            <div key={i} className="flex">
                                <div className="flex min-w-0 flex-1 overflow-hidden">
                                    {renderLead(false)}
                                    {columnWidths.map((width, j) => (
                                        <div key={j} className={BODY_CELL} style={{ width, height: rowHeight }}>
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="flex shrink-0 items-center justify-center gap-2 border-b border-l border-b-border/40 border-l-border px-3"
                                    style={{ width: actionWidth, height: rowHeight }}
                                >
                                    {Array.from({ length: actionIcons }).map((_, k) => (
                                        <Skeleton key={k} className="size-5 rounded-sm opacity-40" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {scrollRatio.y !== null && (
                        <div
                            aria-hidden
                            className="relative shrink-0 border-l border-border bg-background"
                            style={{ width: SCROLLBAR_SIZE }}
                        >
                            <div
                                className="absolute inset-x-0 top-0 rounded-full border-[3px] border-transparent bg-clip-padding bg-[oklch(0.5_0_0/0.25)] dark:bg-[oklch(0.7_0_0/0.25)]"
                                style={{ height: thumbSize(scrollRatio.y) }}
                            />
                        </div>
                    )}
                </div>
                {scrollRatio.x !== null && (
                    <div aria-hidden data-slot="table-scrollbar-x" className="shrink-0">
                        <div data-slot="table-scrollbar-x-thumb" style={{ width: thumbSize(scrollRatio.x) }} />
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="size-8 rounded-md" />
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-[66px] rounded-md" />
                    <Skeleton className="h-4 w-9" />
                </div>
            </div>
        </div>
    )
}
