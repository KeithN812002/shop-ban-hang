'use client'

import {
    Column,
    ColumnDef,
    ColumnPinningState,
    flexRender,
    getCoreRowModel,
    HeaderContext,
    RowData,
    SortingState as TanstackSortingState,
    TableOptions,
    TableState,
    useReactTable,
} from '@tanstack/react-table'
import { Button } from '@workspace/ui/components/Button'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSkeleton,
} from '@workspace/ui/components/Table'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, X, type LucideIcon } from 'lucide-react'
import { EmptyState, resolveEmptyKind, type EmptyStateKind } from '@workspace/ui/components/EmptyState'
import { DataTablePagination, type DataTablePaginationProps } from './DataTablePagination'
import { getActionColor, getActionIcon, type ActionType } from './actionStyles'
import { ColumnManager } from './ColumnManager'
import { useColumnSettings } from './useColumnSettings'
import { useFitHeight } from './useFitHeight'
import type { TableDensity } from './columnSettingsStorage'
import React from 'react'
import type { TFunction } from 'i18next'
import { z } from 'zod'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string
        headerPrefix?: React.ReactNode
        _types?: { data: TData; value: TValue }
    }

    interface TableMeta<TData extends RowData> {
        resetColumnSettings?: () => void
        density?: TableDensity
        setDensity?: (density: TableDensity) => void
        _types?: { data: TData }
    }
}

interface Identifiable {
    id: string | number
}

export interface ActionDef<TData extends Identifiable> {
    id: string
    type: ActionType
    label?: string
    icon?: LucideIcon
    color?: string
    onClick?: (row: TData) => void
    showWhen?: (row: TData) => boolean
}

interface DataTableProps<TData extends Identifiable> {
    columns: ColumnDef<TData, any>[]
    data: TData[]
    actions?: ActionDef<TData>[]
    showNo?: boolean
    startIndex?: number
    t?: TFunction
    containerClassName?: string
    scrollClassName?: string
    scrollHeight?: string
    enableSorting?: boolean
    sorting?: DataTableSorting | null
    setSorting?: (sorting: DataTableSorting | null) => void
    enableRowSelection?: boolean | ((row: any) => boolean)
    rowSelection?: TableState['rowSelection']
    setRowSelection?: TableOptions<TData>['onRowSelectionChange']
    isLoading?: boolean
    columnPinning?: ColumnPinningState
    /** Storage key for the user's column order / visibility / pinning; defaults to the page path + column ids. */
    columnSettingsKey?: string
    /** Remember column settings on this device across reloads. */
    persistColumnSettings?: boolean
    selectHeader?: (props: any) => React.ReactNode
    isActionDisabled?: boolean
    actionColumnSize?: number
    pagination?: DataTablePaginationProps
    emptyHeight?: string
    hideHeaderWhenEmpty?: boolean
    /** Explicit empty kind; when omitted it is derived from isError / hasActiveFilter. */
    emptyKind?: EmptyStateKind
    /** The query failed — the grid says so instead of claiming there is no data. */
    isError?: boolean
    /** At least one search condition is applied, so an empty result means "no match". */
    hasActiveFilter?: boolean
    emptyTitle?: string
    emptyDescription?: string
    emptyAction?: React.ReactNode
    className?: string
    getRowClassName?: (row: TData) => string | undefined
    getRowTitle?: (row: TData) => string | undefined
    getRowGroupLabel?: (row: TData) => string | undefined
    /** Skip line-clamp wrapper so multi-line cell content (e.g. history diff hints) is fully visible. */
    disableCellLineClamp?: boolean
    /** Extra classes applied to every body cell. */
    cellClassName?: string
}

function getCheckboxColumnDef<TData, TValue>(
    selectHeader?: (props: HeaderContext<TData, TValue>) => React.ReactNode,
): ColumnDef<TData> {
    return {
        id: 'select',
        header:
            (selectHeader as any) ??
            (({ table }: any) => (
                <Checkbox
                    aria-label="select all"
                    isSelected={table.getIsAllRowsSelected()}
                    isIndeterminate={table.getIsSomePageRowsSelected()}
                    onChange={(isSelected: any) => table.toggleAllRowsSelected(isSelected)}
                />
            )),
        cell: ({ row }) => (
            <div className="flex justify-center">
                <Checkbox
                    aria-label="select row"
                    isSelected={row.getIsSelected()}
                    isDisabled={!row.getCanSelect()}
                    isIndeterminate={row.getIsSomeSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            </div>
        ),
        size: 42,
        enableSorting: false,
        meta: { className: 'text-center' },
    }
}

function getCommonPinningStyles<T>(column: Column<T>): string {
    const isPinned = column.getIsPinned()

    return cn(
        isPinned === 'left' && 'sticky left-0',
        isPinned === 'right' && 'sticky right-0',
        // Do not set z-index here.
        // Header cells already set `z-[3]` and if this function overrides it, borders
        // can be covered when scrolling (especially with pinned columns).
    )
}

const DataTableSortingSchema = z.object({
    sortBy: z.string(),
    sortDirection: z.enum(['asc', 'desc']),
})

type DataTableSorting = z.infer<typeof DataTableSortingSchema>

const LOADING_SKELETON_ROWS = 5

const DENSITY_CELL_CLASS: Record<TableDensity, string | undefined> = {
    compact: 'py-1.5',
    normal: undefined,
    comfortable: 'py-4',
}

const NON_RESIZABLE_COLUMNS = new Set(['select', '__index', 'actions'])

function DataTable<TData extends Identifiable>({
    data,
    columns,
    actions = [],
    showNo = false,
    startIndex = 0,
    t,
    containerClassName,
    scrollClassName,
    scrollHeight,
    enableSorting = false,
    sorting: controlledSorting,
    setSorting: controlledSetSorting,
    enableRowSelection = false,
    rowSelection,
    setRowSelection,
    isLoading,
    columnPinning,
    columnSettingsKey,
    persistColumnSettings = true,
    selectHeader,
    isActionDisabled,
    actionColumnSize,
    pagination,
    emptyHeight = '200px',
    hideHeaderWhenEmpty = false,
    emptyKind,
    isError,
    hasActiveFilter,
    emptyTitle,
    emptyDescription,
    emptyAction,
    className,
    getRowClassName,
    getRowTitle,
    getRowGroupLabel,
    disableCellLineClamp = false,
    cellClassName,
}: DataTableProps<TData>) {
    const tableRef = React.useRef<HTMLTableElement>(null)
    const [tagsHeight, setTagsHeight] = React.useState(0)
    const isEmptyCompact = (emptyHeight !== 'auto' && parseInt(emptyHeight) <= 100) || hideHeaderWhenEmpty
    const translate = React.useCallback(
        (key: string, options?: unknown) => {
            if (!t) return key
            // Using a safe cast to bypass strict literal checks for generic utility translation
            const fn = t as (k: string, o?: unknown) => string
            return fn(key, options)
        },
        [t],
    )

    React.useEffect(() => {
        if (!tableRef.current) return

        const findTagsContainer = () => {
            let current: HTMLElement | null = tableRef.current
            while (current) {
                const found = current.querySelector('.active-filter-tags-container')
                if (found) return found as HTMLElement
                current = current.parentElement
                if (current?.classList.contains('page-container')) {
                    const deepFound = current.querySelector('.active-filter-tags-container')
                    if (deepFound) return deepFound as HTMLElement
                    break
                }
            }
            return null
        }

        let activeContainer: HTMLElement | null = null

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                setTagsHeight(entry.target.clientHeight > 0 ? entry.target.clientHeight + 16 : 0)
            }
        })

        const updateHeight = () => {
            const container = findTagsContainer()
            if (container !== activeContainer) {
                if (activeContainer) {
                    resizeObserver.unobserve(activeContainer)
                }
                activeContainer = container
                if (container) {
                    resizeObserver.observe(container)
                }
            }
            setTagsHeight(container && container.clientHeight > 0 ? container.clientHeight + 16 : 0)
        }

        const mutationObserver = new MutationObserver(updateHeight)

        mutationObserver.observe(document.body, { childList: true, subtree: true })
        updateHeight()

        return () => {
            resizeObserver.disconnect()
            mutationObserver.disconnect()
        }
    }, [])

    const fitHeight = useFitHeight(tableRef, !!scrollHeight)

    const finalScrollHeight = React.useMemo(() => {
        if (fitHeight !== null) return `${fitHeight}px`
        if (!scrollHeight || tagsHeight === 0) return scrollHeight
        return `calc((${scrollHeight}) - ${tagsHeight}px)`
    }, [scrollHeight, tagsHeight, fitHeight])

    const [uncontrolledSorting, setUncontrolledSorting] = React.useState<DataTableSorting | null>(null)
    const sorting = controlledSorting ?? uncontrolledSorting
    const setSorting = controlledSetSorting ?? setUncontrolledSorting

    const maxVisibleActions = React.useMemo(() => {
        if (!data?.length) return 1
        return data.reduce((max, row) => Math.max(max, actions.filter(a => !a.showWhen || a.showWhen(row)).length), 1)
    }, [actions, data])

    const enhancedColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
        const sttColumn: ColumnDef<TData, any>[] = showNo
            ? [
                  {
                      id: '__index',
                      header: translate('common.index'),
                      cell: ({ row }) => startIndex + row.index + 1,
                      size: 50,
                      enableSorting: false,
                      meta: { className: 'tabular-nums text-center' },
                  },
              ]
            : []

        const actionColumn: ColumnDef<TData, any>[] = actions.length
            ? [
                  {
                      id: 'actions',
                      header: ({ table }: any) => <ColumnManager table={table} translate={translate} />,
                      size: actionColumnSize ?? Math.max(88, maxVisibleActions * 24 + 24),
                      enableSorting: false,
                      meta: {
                          className: 'text-center p-0!',
                      },
                      cell: ({ row }) => {
                          const rowActions = actions.filter(a => !a.showWhen || a.showWhen(row.original))
                          if (!rowActions.length) return null

                          return (
                              <div className="flex justify-center">
                                  {rowActions.map(action => {
                                      const Icon = action.icon ?? getActionIcon(action.type)
                                      const color = action.color ?? getActionColor(action.type)
                                      const label = action.label ? translate(action.label) : undefined

                                      return label ? (
                                          <TooltipTrigger key={action.id} delay={0}>
                                              <Button
                                                  size="iconSm"
                                                  variant="ghost"
                                                  aria-label={label}
                                                  onPress={() => {
                                                      action.onClick?.(row.original)
                                                  }}
                                                  isDisabled={isActionDisabled}
                                              >
                                                  <Icon className={cn('size-4', color)} />
                                              </Button>
                                              <Tooltip>{label}</Tooltip>
                                          </TooltipTrigger>
                                      ) : (
                                          <Button
                                              key={action.id}
                                              size="iconSm"
                                              variant="ghost"
                                              aria-label={label}
                                              onPress={() => {
                                                  action.onClick?.(row.original)
                                              }}
                                              isDisabled={isActionDisabled}
                                          >
                                              <Icon className={cn('size-4', color)} />
                                          </Button>
                                      )
                                  })}
                              </div>
                          )
                      },
                  },
              ]
            : []

        return [
            ...(enableRowSelection ? [getCheckboxColumnDef<TData, any>(selectHeader)] : []),
            ...sttColumn,
            ...columns,
            ...actionColumn,
        ]
    }, [
        actions,
        columns,
        enableRowSelection,
        isActionDisabled,
        selectHeader,
        showNo,
        startIndex,
        translate,
        actionColumnSize,
        maxVisibleActions,
    ]).map(col => ({
        ...col,
        id: col.id || (col as any).accessorKey || (typeof col.header === 'string' ? col.header : undefined),
    }))

    const columnIds = enhancedColumns.map(c => c.id as string)
    const {
        defaultColumnPinning,
        columnOrder,
        columnVisibility,
        columnPinningState,
        columnSizing,
        density,
        setDensity,
        resizingColumnId,
        onColumnOrderChange,
        onColumnVisibilityChange,
        onColumnPinningChange,
        resetColumnSettings,
        startColumnResize,
        resetColumnWidth,
    } = useColumnSettings({ columnIds, columnPinning, columnSettingsKey, persistColumnSettings })

    const table = useReactTable({
        data,
        columns: enhancedColumns,
        enableRowSelection:
            typeof enableRowSelection === 'function' ? row => enableRowSelection(row.original) : enableRowSelection,
        ...(setRowSelection ? { onRowSelectionChange: setRowSelection } : {}),
        manualSorting: true,
        enableSorting,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: updater => {
            const oldTanstackSorting: TanstackSortingState = sorting
                ? [{ id: sorting.sortBy, desc: sorting.sortDirection === 'desc' }]
                : []

            const newTanstackSorting = typeof updater === 'function' ? updater(oldTanstackSorting) : updater

            if (newTanstackSorting[0]?.id) {
                setSorting({
                    sortBy: newTanstackSorting[0].id,
                    sortDirection: newTanstackSorting[0].desc ? 'desc' : 'asc',
                })
            } else {
                setSorting(null)
            }
        },
        onColumnVisibilityChange,
        onColumnPinningChange,
        state: {
            ...(rowSelection ? { rowSelection } : {}),
            sorting: sorting ? [{ id: sorting.sortBy, desc: sorting.sortDirection === 'desc' }] : [],
            columnVisibility,
            columnPinning: columnPinningState,
            columnOrder,
            columnSizing,
        },
        onColumnOrderChange,
        getRowId: row => String(row.id),
        defaultColumn: { size: 180 },
        initialState: {
            columnPinning: defaultColumnPinning,
        },
        meta: {
            density,
            setDensity,
            resetColumnSettings,
        },
    })

    const [colWidths, setColWidths] = React.useState<Record<string, number>>({})

    React.useLayoutEffect(() => {
        const tableEl = tableRef.current
        if (!tableEl) return
        const measure = () => {
            const next: Record<string, number> = {}
            tableEl.querySelectorAll<HTMLElement>('thead th[data-col-id]').forEach(th => {
                const id = th.getAttribute('data-col-id')
                if (id) next[id] = th.getBoundingClientRect().width
            })
            setColWidths(prev => {
                const keys = Object.keys(next)
                if (keys.length === Object.keys(prev).length && keys.every(k => prev[k] === next[k])) return prev
                return next
            })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(tableEl)
        return () => ro.disconnect()
    }, [enhancedColumns.length, columnPinningState, columnSizing, data])

    const getPinnedStyle = React.useCallback(
        (column: Column<TData>): React.CSSProperties => {
            const pinned = column.getIsPinned()
            const resized = columnSizing[column.id]
            const style: React.CSSProperties = resized
                ? { width: resized, minWidth: resized, maxWidth: resized }
                : { minWidth: column.columnDef.size }
            if (pinned === 'left') {
                const ids = columnPinningState.left ?? []
                let acc = 0
                for (const id of ids) {
                    if (id === column.id) break
                    acc += colWidths[id] ?? 0
                }
                style.left = `${acc}px`
            } else if (pinned === 'right') {
                const ids = columnPinningState.right ?? []
                let acc = 0
                for (let i = ids.length - 1; i >= 0; i--) {
                    if (ids[i] === column.id) break
                    acc += colWidths[ids[i]] ?? 0
                }
                style.right = `${acc}px`
            }
            return style
        },
        [colWidths, columnPinningState, columnSizing],
    )

    const selectedCount = enableRowSelection
        ? rowSelection
            ? Object.values(rowSelection).filter(Boolean).length
            : table.getSelectedRowModel().rows.length
        : 0

    const clearSelection = () => {
        if (setRowSelection) setRowSelection({})
        else table.resetRowSelection()
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <Table
                ref={tableRef}
                containerClassName={cn('relative', containerClassName)}
                scrollClassName={scrollClassName}
                scrollHeight={finalScrollHeight}
            >
                {!(hideHeaderWhenEmpty && table.getRowModel().rows.length === 0) && (
                    <TableHeader className="z-[30]">
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        data-col-id={header.column.id}
                                        aria-sort={
                                            header.column.getCanSort()
                                                ? (({ asc: 'ascending', desc: 'descending' } as const)[
                                                      header.column.getIsSorted() as 'asc' | 'desc'
                                                  ] ?? 'none')
                                                : undefined
                                        }
                                        style={getPinnedStyle(header.column)}
                                        className={cn(
                                            'sticky top-0 border-b border-border transition-colors last:border-r-0 text-center',
                                            header.column.getIsPinned()
                                                ? 'z-[40] bg-muted before:absolute before:inset-0 before:bg-muted before:z-[-1]'
                                                : 'z-[30] bg-muted',
                                            header.column.getIsPinned() === 'left' &&
                                                'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]',
                                            header.column.getIsPinned() === 'right' &&
                                                'after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]',
                                            getCommonPinningStyles(header.column),
                                            header.column.columnDef.meta?.className,
                                        )}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={cn(
                                                    'relative flex items-center justify-center w-full h-full',
                                                    header.column.getCanSort()
                                                        ? 'px-7 group cursor-pointer select-none'
                                                        : 'px-2',
                                                )}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {header.column.columnDef.meta?.headerPrefix && (
                                                    <div
                                                        className="absolute left-2 top-1/2 -translate-y-1/2"
                                                        onClick={event => event.stopPropagation()}
                                                    >
                                                        {header.column.columnDef.meta.headerPrefix}
                                                    </div>
                                                )}
                                                {header.column.getCanSort() ? (
                                                    <button
                                                        type="button"
                                                        className="truncate rounded-sm outline-none [text-transform:inherit] focus-visible:ring-2 focus-visible:ring-primary/50"
                                                        aria-label={
                                                            typeof header.column.columnDef.header === 'string'
                                                                ? translate('common.sortBy', {
                                                                      label: header.column.columnDef.header,
                                                                  })
                                                                : undefined
                                                        }
                                                        onClick={event => {
                                                            event.stopPropagation()
                                                            header.column.getToggleSortingHandler()?.(event)
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="truncate">
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext(),
                                                        )}
                                                    </span>
                                                )}
                                                {header.column.getCanSort() && (
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        {{
                                                            asc: <ArrowUpIcon className="size-4! text-primary" />,
                                                            desc: <ArrowDownIcon className="size-4! text-primary" />,
                                                        }[header.column.getIsSorted() as string] ?? (
                                                            <ChevronsUpDown className="size-4! opacity-30 group-hover:opacity-100" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!NON_RESIZABLE_COLUMNS.has(header.column.id) && (
                                            <div
                                                role="separator"
                                                aria-orientation="vertical"
                                                aria-label={translate('common.resizeColumn')}
                                                onPointerDown={event => startColumnResize(event, header.column.id)}
                                                onClick={event => event.stopPropagation()}
                                                onDoubleClick={() => resetColumnWidth(header.column.id)}
                                                className={cn(
                                                    'absolute right-0 top-0 z-[1] h-full w-1.5 cursor-col-resize select-none touch-none',
                                                    'hover:bg-primary/40',
                                                    resizingColumnId === header.column.id && 'bg-primary/60',
                                                )}
                                            />
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                )}

                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, rowIndex, allRows) => (
                            <React.Fragment key={row.id}>
                                {(() => {
                                    if (!getRowGroupLabel) return null
                                    const label = getRowGroupLabel(row.original)
                                    if (!label) return null
                                    const previous = rowIndex > 0 ? allRows[rowIndex - 1] : undefined
                                    if (previous && getRowGroupLabel(previous.original) === label) return null
                                    return (
                                        <TableRow data-slot="table-row-group" className="hover:bg-transparent">
                                            <TableCell
                                                colSpan={table.getVisibleLeafColumns().length}
                                                className="bg-muted/40 py-1.5"
                                            >
                                                <span className="text-xs font-semibold text-foreground">{label}</span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })()}
                                <TableRow
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={getRowClassName?.(row.original)}
                                    title={getRowTitle?.(row.original)}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        // Remove the bottom border for the last table row.
                                        // This avoids a "double/bloating" line at the very bottom when scrolling.
                                        <TableCell
                                            key={cell.id}
                                            style={getPinnedStyle(cell.column)}
                                            className={cn(
                                                cell.column.getIsPinned()
                                                    ? 'z-[20] bg-background before:absolute before:inset-0 before:z-[-1] before:bg-background transition-colors group-hover/table-row:bg-muted group-data-[state=selected]/table-row:bg-accent'
                                                    : 'z-[0]',
                                                cell.column.getIsPinned() === 'left' &&
                                                    'after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]',
                                                cell.column.getIsPinned() === 'right' &&
                                                    'after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]',
                                                getCommonPinningStyles(cell.column),
                                                DENSITY_CELL_CLASS[density],
                                                cellClassName,
                                                cell.column.columnDef.meta?.className,
                                            )}
                                            // Only show the raw value as a tooltip for plain accessor cells.
                                            // Custom-rendered cells (badges, mapped labels, dates) display text
                                            // that differs from getValue(), so the raw value would leak codes.
                                            title={
                                                typeof cell.column.columnDef.cell === 'function'
                                                    ? undefined
                                                    : String(cell.getValue() || '')
                                            }
                                        >
                                            {cell.column.id === 'select' ||
                                            cell.column.id === '__index' ||
                                            cell.column.id === 'actions' ? (
                                                flexRender(cell.column.columnDef.cell, cell.getContext())
                                            ) : disableCellLineClamp ? (
                                                flexRender(cell.column.columnDef.cell, cell.getContext())
                                            ) : (
                                                <div
                                                    className="max-w-[500px] break-words"
                                                    style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        ))
                    ) : isLoading ? (
                        <TableSkeleton columns={table.getVisibleLeafColumns().length} rows={LOADING_SKELETON_ROWS} />
                    ) : (
                        <tr data-slot="table-row-empty">
                            <TableCell colSpan={enhancedColumns.length} className="border-b-0 p-0">
                                <div
                                    className="flex justify-center items-center overflow-hidden"
                                    style={{
                                        position: 'sticky',
                                        left: 0,
                                        width: '100cqw',
                                        minHeight: emptyHeight,
                                    }}
                                >
                                    <EmptyState
                                        kind={emptyKind ?? resolveEmptyKind({ isError, hasActiveFilter })}
                                        title={emptyTitle}
                                        description={emptyDescription}
                                        action={emptyAction}
                                        icon={isEmptyCompact && !hideHeaderWhenEmpty ? null : undefined}
                                        variant={isEmptyCompact ? 'compact' : 'default'}
                                    />
                                </div>
                            </TableCell>
                        </tr>
                    )}
                </TableBody>
            </Table>
            {(selectedCount > 0 || pagination) && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-foreground">
                                {translate('common.selectedCount', { count: selectedCount })}
                            </span>
                            <Button variant="link" size="sm" className="h-auto gap-1 p-0" onPress={clearSelection}>
                                <X className="size-3.5" />
                                {translate('common.clearSelection')}
                            </Button>
                        </div>
                    )}
                    {pagination && (
                        <DataTablePagination
                            className="mt-0 ml-auto"
                            {...pagination}
                            paginationSummary={
                                pagination.paginationSummary ??
                                (pagination.totalItems > 0
                                    ? translate('common.paginationSummary', {
                                          start: (pagination.pageNumber - 1) * pagination.pageSize + 1,
                                          end: Math.min(
                                              pagination.pageNumber * pagination.pageSize,
                                              pagination.totalItems,
                                          ),
                                          total: pagination.totalItems,
                                      })
                                    : '')
                            }
                            itemsPerPageLabel={pagination.itemsPerPageLabel ?? translate('common.itemsPerPage')}
                            goToPageLabel={pagination.goToPageLabel ?? translate('common.goToPage')}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export { DataTable, DataTableSortingSchema, getCheckboxColumnDef, getCommonPinningStyles }
export type { DataTableProps, DataTableSorting, Identifiable }
