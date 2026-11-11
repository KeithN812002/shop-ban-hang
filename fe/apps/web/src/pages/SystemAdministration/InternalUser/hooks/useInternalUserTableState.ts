import { useCallback, useMemo } from 'react'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import type { InternalUserFilterRequest } from '../types'

export const useInternalUserTableState = (
    filters: InternalUserFilterRequest,
    setFilters: (
        filters: InternalUserFilterRequest | ((prev: InternalUserFilterRequest) => InternalUserFilterRequest),
    ) => void,
) => {
    const pageNumber = filters.pageNumber || 1
    const pageSize = filters.pageSize || 20

    const sorting = useMemo<DataTableSorting | null>(() => {
        if (!filters.fieldName) return null
        return {
            sortBy: filters.fieldName,
            sortDirection: (filters.sortType?.toLowerCase() as 'asc' | 'desc') || 'desc',
        }
    }, [filters.fieldName, filters.sortType])

    const onPageChange = useCallback(
        (page: number) => {
            setFilters(prev => ({ ...prev, pageNumber: page }))
        },
        [setFilters],
    )

    const onPageSizeChange = useCallback(
        (size: number) => {
            setFilters(prev => ({ ...prev, pageSize: size, pageNumber: 1 }))
        },
        [setFilters],
    )

    const onSortChange = useCallback(
        (newSorting: DataTableSorting | null) => {
            setFilters(prev => ({
                ...prev,
                fieldName: newSorting?.sortBy,
                sortType: newSorting?.sortDirection
                    ? (newSorting.sortDirection.toUpperCase() as 'ASC' | 'DESC')
                    : undefined,
                pageNumber: 1,
            }))
        },
        [setFilters],
    )

    return {
        pageNumber,
        pageSize,
        sorting,
        onPageChange,
        onPageSizeChange,
        onSortChange,
    }
}
