import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, type ActionDef, type DataTableSorting, type Identifiable } from '@workspace/ui/components/DataTable'

export interface ShopTablePagination {
    pageNumber: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
}

export interface ShopDataTableProps<TRow extends Identifiable> {
    rows: TRow[]
    columns: ColumnDef<TRow>[]
    actions?: ActionDef<TRow>[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination?: ShopTablePagination
    /** Space taken by the filter bar and anything above the grid; tabs add ~56px. */
    scrollHeight?: string
}

export const DEFAULT_TABLE_HEIGHT = 'max(320px, calc(100dvh - 388px))'
export const TABS_TABLE_HEIGHT = 'max(320px, calc(100dvh - 444px))'

/** The `DataTable` configuration every shop admin list shares: pinned action column, server-side sort and paging. */
export const ShopDataTable = <TRow extends Identifiable>({
    rows,
    columns,
    actions,
    isLoading,
    isError,
    hasActiveFilter,
    startIndex = 0,
    sorting,
    onSortChange,
    pagination,
    scrollHeight = DEFAULT_TABLE_HEIGHT,
}: ShopDataTableProps<TRow>) => {
    const { t } = useTranslation()
    return (
        <DataTable
            data={rows}
            columns={columns}
            actions={actions}
            startIndex={startIndex}
            isLoading={isLoading}
            isError={isError}
            hasActiveFilter={hasActiveFilter}
            t={t}
            scrollHeight={scrollHeight}
            columnPinning={actions && actions.length > 0 ? { right: ['actions'] } : undefined}
            enableSorting={!!onSortChange}
            sorting={sorting}
            setSorting={onSortChange}
            pagination={pagination}
        />
    )
}
