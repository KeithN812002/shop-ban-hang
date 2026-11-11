import { useCallback, useMemo, useState } from 'react'
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import type { PaginatedResponse, PagingBase } from '@/types/api.types'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

interface UsePagedFiltersOptions<TForm extends FieldValues, TFilter extends PagingBase> {
    defaultFilters: TFilter
    defaultForm: TForm
    /** Maps the filter form to the request filters (paging/sorting are handled here). */
    toFilters: (form: TForm) => Partial<TFilter>
    /** Values applied on mount (e.g. a deep link from another screen). */
    initialFilters?: Partial<TFilter>
    initialForm?: Partial<TForm>
}

/**
 * Filter form + server-side paging/sorting state shared by every shop admin list screen.
 * Replaces the per-screen `use{Screen}Filters` / `use{Screen}TableState` pair, which only differ by field mapping.
 */
export const usePagedFilters = <TForm extends FieldValues, TFilter extends PagingBase>({
    defaultFilters,
    defaultForm,
    toFilters,
    initialFilters,
    initialForm,
}: UsePagedFiltersOptions<TForm, TFilter>) => {
    const [filters, setFilters] = useState<TFilter>(() => ({ ...defaultFilters, ...initialFilters }))
    const methods = useForm<TForm>({ defaultValues: { ...defaultForm, ...initialForm } as DefaultValues<TForm> })
    const { reset } = methods

    const onSearch = useCallback(
        (form: TForm) => {
            setFilters(prev => keepTableState(prev, { ...defaultFilters, ...toFilters(form), pageNumber: 1 }))
        },
        [defaultFilters, toFilters],
    )

    const onReset = useCallback(() => {
        reset(defaultForm as DefaultValues<TForm>)
        setFilters(prev => keepPageSize(prev, defaultFilters))
    }, [defaultFilters, defaultForm, reset])

    const pageNumber = filters.pageNumber || 1
    const pageSize = filters.pageSize || defaultFilters.pageSize || 20

    const sorting = useMemo<DataTableSorting | null>(() => {
        if (!filters.fieldName) return null
        return {
            sortBy: filters.fieldName,
            sortDirection: (filters.sortType?.toLowerCase() as 'asc' | 'desc') || 'desc',
        }
    }, [filters.fieldName, filters.sortType])

    const onPageChange = useCallback((page: number) => setFilters(prev => ({ ...prev, pageNumber: page })), [])
    const onPageSizeChange = useCallback(
        (size: number) => setFilters(prev => ({ ...prev, pageSize: size, pageNumber: 1 })),
        [],
    )
    const onSortChange = useCallback((next: DataTableSorting | null) => {
        setFilters(prev => ({
            ...prev,
            fieldName: next?.sortBy,
            sortType: next?.sortDirection ? next.sortDirection.toUpperCase() : undefined,
            pageNumber: 1,
        }))
    }, [])

    return {
        filters,
        setFilters,
        methods,
        onSearch,
        onReset,
        hasActiveFilter: hasActiveFilters(filters, defaultFilters),
        pageNumber,
        pageSize,
        sorting,
        onPageChange,
        onPageSizeChange,
        onSortChange,
    }
}

interface PagedState {
    pageNumber: number
    pageSize: number
    sorting: DataTableSorting | null
    hasActiveFilter: boolean
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    onSortChange: (sorting: DataTableSorting | null) => void
}

interface PagedQueryLike<TRow> {
    data?: PaginatedResponse<TRow>
    isLoading: boolean
    isFetching: boolean
    isError: boolean
}

/** Adapts a paged query + `usePagedFilters` state to the props of `ShopDataTable`. */
export const toTableProps = <TRow>(query: PagedQueryLike<TRow>, paged: PagedState) => {
    const page = query.data?.page || paged.pageNumber
    const size = query.data?.pageSize || paged.pageSize
    return {
        rows: query.data?.items ?? [],
        isLoading: query.isLoading || query.isFetching,
        isError: query.isError,
        hasActiveFilter: paged.hasActiveFilter,
        startIndex: (page - 1) * size,
        sorting: paged.sorting,
        onSortChange: paged.onSortChange,
        pagination: {
            pageNumber: page,
            pageSize: size,
            totalItems: query.data?.total ?? 0,
            totalPages: query.data?.totalPages ?? 0,
            onPageChange: paged.onPageChange,
            onPageSizeChange: paged.onPageSizeChange,
        },
    }
}
