'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'
import { EmptyState, type EmptyStateKind } from '../EmptyState/EmptyState'
import { resolveEmptyKind } from '../EmptyState/resolveEmptyKind'

export interface TableProps extends React.ComponentProps<'table'> {
    containerClassName?: string
    scrollClassName?: string
    scrollHeight?: string
    trackScroll?: boolean
}

const MIN_THUMB_WIDTH = 32
const SCROLLBAR_X_HEIGHT = 11

const supportsOverlayScrollbar = () =>
    typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(::-webkit-scrollbar)')

function TableScrollbarX({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
    const trackRef = React.useRef<HTMLDivElement>(null)
    const thumbRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const container = containerRef.current
        const wrapper = container?.parentElement
        const track = trackRef.current
        const thumb = thumbRef.current
        if (!container || !wrapper || !track || !thumb) return

        let maxThumbLeft = 0

        const syncThumb = () => {
            const overflow = container.scrollWidth - container.clientWidth
            if (overflow <= 1) return
            thumb.style.transform = `translateX(${(container.scrollLeft / overflow) * maxThumbLeft}px)`
        }

        const setReservedHeight = (visible: boolean) => {
            const style = getComputedStyle(wrapper)
            const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
            const value = `${visible ? SCROLLBAR_X_HEIGHT + borders : 0}px`
            if (wrapper.style.getPropertyValue('--table-scrollbar-x-h') !== value) {
                wrapper.style.setProperty('--table-scrollbar-x-h', value)
            }
            wrapper.toggleAttribute('data-scrollbar-x', visible)
        }

        const measure = () => {
            const { scrollWidth, clientWidth } = container
            if (scrollWidth - clientWidth <= 1) {
                track.hidden = true
                setReservedHeight(false)
                return
            }
            track.hidden = false
            setReservedHeight(true)
            const trackWidth = track.clientWidth
            const thumbWidth = Math.max(MIN_THUMB_WIDTH, (trackWidth * clientWidth) / scrollWidth)
            maxThumbLeft = trackWidth - thumbWidth
            thumb.style.width = `${thumbWidth}px`
            syncThumb()
        }

        const onPointerDown = (event: PointerEvent) => {
            event.preventDefault()
            const startX = event.clientX
            const startLeft = container.scrollLeft
            const ratio = (container.scrollWidth - container.clientWidth) / Math.max(1, maxThumbLeft)
            thumb.setPointerCapture(event.pointerId)
            thumb.dataset.dragging = ''
            const onMove = (moveEvent: PointerEvent) => {
                container.scrollLeft = startLeft + (moveEvent.clientX - startX) * ratio
            }
            const onUp = () => {
                delete thumb.dataset.dragging
                thumb.removeEventListener('pointermove', onMove)
                thumb.removeEventListener('pointerup', onUp)
                thumb.removeEventListener('pointercancel', onUp)
            }
            thumb.addEventListener('pointermove', onMove)
            thumb.addEventListener('pointerup', onUp)
            thumb.addEventListener('pointercancel', onUp)
        }

        measure()
        container.addEventListener('scroll', syncThumb, { passive: true })
        thumb.addEventListener('pointerdown', onPointerDown)
        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(container)
        resizeObserver.observe(track)
        if (container.firstElementChild) resizeObserver.observe(container.firstElementChild)

        return () => {
            container.removeEventListener('scroll', syncThumb)
            thumb.removeEventListener('pointerdown', onPointerDown)
            resizeObserver.disconnect()
        }
    }, [containerRef])

    return (
        <div ref={trackRef} aria-hidden data-slot="table-scrollbar-x" hidden>
            <div ref={thumbRef} data-slot="table-scrollbar-x-thumb" />
        </div>
    )
}

const Table = React.forwardRef<HTMLDivElement, TableProps>(
    ({ className, containerClassName, scrollClassName, scrollHeight, trackScroll = true, children, ...props }, ref) => {
        const containerRef = React.useRef<HTMLDivElement>(null)
        const tableRef = React.useRef<HTMLTableElement>(null)
        const [overlayScrollbar] = React.useState(supportsOverlayScrollbar)

        React.useEffect(() => {
            if (!trackScroll) return
            const container = containerRef.current
            const table = tableRef.current
            if (!container || !table) return

            const wrapper = container.parentElement

            const updateScrollState = () => {
                const { scrollLeft, scrollWidth, clientWidth, scrollTop } = container
                table.setAttribute('data-at-start', String(scrollLeft === 0))
                table.setAttribute('data-at-end', String(Math.abs(scrollLeft + clientWidth - scrollWidth) < 1))
                wrapper?.setAttribute('data-scrolled', String(scrollTop > 0))
            }

            const updateLayout = () => {
                wrapper?.style.setProperty('--table-header-h', `${table.tHead?.offsetHeight ?? 0}px`)
                updateScrollState()
            }

            updateLayout()
            container.addEventListener('scroll', updateScrollState, { passive: true })
            const observer = new ResizeObserver(updateLayout)
            observer.observe(container)
            observer.observe(table)
            const headerObserver = new MutationObserver(updateLayout)
            if (table.tHead) {
                headerObserver.observe(table.tHead, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                })
            }

            return () => {
                container.removeEventListener('scroll', updateScrollState)
                observer.disconnect()
                headerObserver.disconnect()
            }
        }, [trackScroll])

        return (
            <div
                ref={ref}
                className={cn(
                    'group/table-wrapper relative grid rounded-md border bg-background overflow-hidden',
                    containerClassName,
                )}
                style={scrollHeight ? { maxHeight: scrollHeight } : undefined}
            >
                <div
                    ref={containerRef}
                    data-slot="table-container"
                    data-scroll-y={scrollHeight ? '' : undefined}
                    data-overlay-x={overlayScrollbar ? '' : undefined}
                    className={cn('w-full overflow-auto', scrollClassName)}
                    style={{
                        maxHeight: scrollHeight ? `calc(${scrollHeight} - var(--table-scrollbar-x-h, 0px))` : undefined,
                        containerType: 'inline-size',
                        containerName: 'table-container',
                    }}
                >
                    <table
                        ref={tableRef}
                        data-slot="table"
                        className={cn(
                            'group group/table w-full caption-bottom text-sm border-separate border-spacing-0',
                            className,
                        )}
                        {...props}
                    >
                        {children}
                    </table>
                </div>
                <div
                    aria-hidden
                    data-slot="table-header-shadow"
                    className="pointer-events-none absolute inset-x-0 z-[25] h-2 bg-gradient-to-b from-black/10 to-transparent opacity-0 transition-opacity group-data-[scrolled=true]/table-wrapper:opacity-100"
                    style={{ top: 'var(--table-header-h, 0px)' }}
                />
                {overlayScrollbar && <TableScrollbarX containerRef={containerRef} />}
            </div>
        )
    },
)
Table.displayName = 'Table'

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
    return <thead data-slot="table-header" className={cn('sticky top-0 z-[2]', className)} {...props} />
}

function TableBody({ className, children, ...props }: React.ComponentProps<'tbody'>) {
    return (
        <tbody data-slot="table-body" className={cn(className)} {...props}>
            {children}
        </tbody>
    )
}

const TableRow = React.memo(function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
    return (
        <tr
            data-slot="table-row"
            className={cn(
                'group/table-row transition-colors hover:bg-muted/30',
                'data-[state=selected]:bg-accent/40',
                className,
            )}
            {...props}
        />
    )
})

const TableHead = React.memo(function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
    // Extract width classes to apply them as min-width to prevent shrinking
    const widthClass = className?.split(' ').find(c => c.startsWith('w-'))
    const style = widthClass ? { minWidth: 'var(--tw-width)' } : undefined

    return (
        <th
            data-slot="table-head"
            className={cn(
                'h-11 whitespace-nowrap bg-muted px-3 text-left align-middle font-semibold text-foreground/80 text-xs uppercase tracking-wider transition-colors border-r border-border/50 last:border-r-0',
                '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                className,
            )}
            style={style as any}
            {...props}
        />
    )
})

const TableCell = React.memo(function TableCell({
    className,
    noBgInherit = false,
    ...props
}: React.ComponentProps<'td'> & { noBgInherit?: boolean }) {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                'whitespace-nowrap p-3 align-middle border-b border-border/40 border-r border-border/40 last:border-r-0',
                '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
                !noBgInherit && 'bg-inherit',
                className,
            )}
            {...props}
        />
    )
})

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn('border-t bg-neutral-400/10 font-medium', className)}
            {...props}
        />
    )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
    return (
        <caption data-slot="table-caption" className={cn('my-4 text-sm text-muted-foreground', className)} {...props} />
    )
}

export interface TableEmptyProps {
    colSpan: number
    icon?: LucideIcon | null
    variant?: 'default' | 'compact'
    /** Explicit empty kind; when omitted it is derived from isError / hasActiveFilter. */
    kind?: EmptyStateKind
    isError?: boolean
    hasActiveFilter?: boolean
    title?: string
    description?: string
    action?: React.ReactNode
}

function TableEmpty({
    colSpan,
    icon,
    variant,
    kind,
    isError,
    hasActiveFilter,
    title,
    description,
    action,
}: TableEmptyProps) {
    const isCompact = variant === 'compact' || (variant === undefined && icon === null)
    const resolvedKind = kind ?? resolveEmptyKind({ isError, hasActiveFilter })

    return (
        <tr data-slot="table-row-empty">
            <td colSpan={colSpan} className="p-0 border-b-0">
                <div
                    className="flex justify-center items-center overflow-hidden"
                    style={{
                        position: 'sticky',
                        left: 0,
                        width: '100cqw',
                        minHeight: isCompact ? '90px' : '150px',
                    }}
                >
                    <EmptyState
                        kind={resolvedKind}
                        title={title}
                        description={description}
                        action={action}
                        icon={icon}
                        variant={isCompact ? 'compact' : 'default'}
                    />
                </div>
            </td>
        </tr>
    )
}

export interface TableSkeletonProps {
    rows?: number
    columns: number
    columnWidths?: (number | string)[]
}

function TableSkeleton({ rows = 5, columns, columnWidths }: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableCell key={colIndex} noBgInherit>
                            <div
                                className="h-4 animate-pulse rounded bg-muted"
                                style={
                                    columnWidths?.[colIndex]
                                        ? {
                                              width:
                                                  typeof columnWidths[colIndex] === 'number'
                                                      ? `${columnWidths[colIndex]}px`
                                                      : columnWidths[colIndex],
                                          }
                                        : { width: '80%' }
                                }
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}

export {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableEmpty,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeleton,
}
