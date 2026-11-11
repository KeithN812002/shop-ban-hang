import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { RoleFilterRequest } from '../types'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

export interface RoleFilterForm extends Omit<
    RoleFilterRequest,
    'createdDateFrom' | 'createdDateTo' | 'updatedDateFrom' | 'updatedDateTo'
> {
    createdDateRange?: { start?: string; end?: string }
    updatedDateRange?: { start?: string; end?: string }
}

export const DEFAULT_ROLE_FILTERS: RoleFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    code: '',
    name: '',
    status: [],
    createdBy: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedBy: '',
    updatedDateFrom: '',
    updatedDateTo: '',
}

export const DEFAULT_ROLE_FORM_VALUES: RoleFilterForm = {
    ...DEFAULT_ROLE_FILTERS,
    createdDateRange: { start: undefined, end: undefined },
    updatedDateRange: { start: undefined, end: undefined },
}

const areRoleFiltersEqual = (a: RoleFilterRequest, b: RoleFilterRequest) => {
    if (
        a.pageNumber !== b.pageNumber ||
        a.pageSize !== b.pageSize ||
        a.fieldName !== b.fieldName ||
        a.sortType !== b.sortType ||
        a.code !== b.code ||
        a.name !== b.name ||
        a.createdBy !== b.createdBy ||
        a.updatedBy !== b.updatedBy ||
        a.createdDateFrom !== b.createdDateFrom ||
        a.createdDateTo !== b.createdDateTo ||
        a.updatedDateFrom !== b.updatedDateFrom ||
        a.updatedDateTo !== b.updatedDateTo
    )
        return false

    if (JSON.stringify(a.status ?? []) !== JSON.stringify(b.status ?? [])) return false

    return true
}

export const useRoleFilters = (onFilterChange?: (filters: RoleFilterRequest) => void) => {
    const [filters, setFilters] = useState<RoleFilterRequest>(DEFAULT_ROLE_FILTERS)

    const methods = useForm<RoleFilterForm>({
        defaultValues: DEFAULT_ROLE_FORM_VALUES,
    })

    const { reset } = methods

    const handleSearch = (data: RoleFilterForm) => {
        const { createdDateRange, updatedDateRange, ...rest } = data

        const searchFilters: RoleFilterRequest = keepTableState(filters, {
            ...filters,
            ...rest,
            createdDateFrom: createdDateRange?.start ? `${createdDateRange.start}T00:00:00` : '',
            createdDateTo: createdDateRange?.end ? `${createdDateRange.end}T23:59:59` : '',
            updatedDateFrom: updatedDateRange?.start ? `${updatedDateRange.start}T00:00:00` : '',
            updatedDateTo: updatedDateRange?.end ? `${updatedDateRange.end}T23:59:59` : '',
            pageNumber: 1,
        })

        if (!areRoleFiltersEqual(filters, searchFilters)) {
            setFilters(searchFilters)
            onFilterChange?.(searchFilters)
        }
    }

    const handleReset = () => {
        reset(DEFAULT_ROLE_FORM_VALUES)
        const nextFilters = keepPageSize(filters, DEFAULT_ROLE_FILTERS)
        setFilters(nextFilters)
        onFilterChange?.(nextFilters)
    }

    return {
        filters,
        setFilters,
        hasActiveFilter: hasActiveFilters(filters, DEFAULT_ROLE_FILTERS),
        methods,
        onSearch: handleSearch,
        onReset: handleReset,
    }
}
