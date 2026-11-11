import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { InternalUserFilterRequest } from '../types'
import { AuthorizationStatusEnum } from '@/constants/options'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

export interface InternalUserFilterForm extends Omit<
    InternalUserFilterRequest,
    'createdDateFrom' | 'createdDateTo' | 'updatedDateFrom' | 'updatedDateTo' | 'unassignedRole'
> {
    createdDateRange?: { start?: string; end?: string }
    updatedDateRange?: { start?: string; end?: string }
    unassignedRole?: AuthorizationStatusEnum
}

export const DEFAULT_INTERNAL_USER_FILTERS: InternalUserFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    userName: '',
    personalName: '',
    email: '',
    status: [],
    createdBy: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedBy: '',
    updatedDateFrom: '',
    updatedDateTo: '',
    unassignedRole: undefined,
}

export const DEFAULT_INTERNAL_USER_FORM_VALUES: InternalUserFilterForm = {
    ...DEFAULT_INTERNAL_USER_FILTERS,
    unassignedRole: undefined,
    createdDateRange: { start: undefined, end: undefined },
    updatedDateRange: { start: undefined, end: undefined },
}

export const useInternalUserFilters = (onFilterChange?: (filters: InternalUserFilterRequest) => void) => {
    const [filters, setFilters] = useState<InternalUserFilterRequest>(DEFAULT_INTERNAL_USER_FILTERS)

    const methods = useForm<InternalUserFilterForm>({
        defaultValues: DEFAULT_INTERNAL_USER_FORM_VALUES,
    })

    const { reset } = methods

    const handleSearch = (data: InternalUserFilterForm) => {
        const { createdDateRange, updatedDateRange, unassignedRole, ...rest } = data

        let resolvedUnassignedRole: boolean | undefined = undefined
        if (unassignedRole === AuthorizationStatusEnum.UNASSIGNED) {
            resolvedUnassignedRole = true
        } else if (unassignedRole === AuthorizationStatusEnum.ASSIGNED) {
            resolvedUnassignedRole = false
        }

        const searchFilters: InternalUserFilterRequest = keepTableState(filters, {
            ...filters,
            ...rest,
            unassignedRole: resolvedUnassignedRole,
            pageNumber: 1,
            createdDateFrom: createdDateRange?.start ? `${createdDateRange.start}T00:00:00` : '',
            createdDateTo: createdDateRange?.end ? `${createdDateRange.end}T23:59:59` : '',
            updatedDateFrom: updatedDateRange?.start ? `${updatedDateRange.start}T00:00:00` : '',
            updatedDateTo: updatedDateRange?.end ? `${updatedDateRange.end}T23:59:59` : '',
        })

        setFilters(searchFilters)
        onFilterChange?.(searchFilters)
    }

    const handleReset = () => {
        reset(DEFAULT_INTERNAL_USER_FORM_VALUES)
        const nextFilters = keepPageSize(filters, DEFAULT_INTERNAL_USER_FILTERS)
        setFilters(nextFilters)
        onFilterChange?.(nextFilters)
    }

    return {
        filters,
        setFilters,
        hasActiveFilter: hasActiveFilters(filters, DEFAULT_INTERNAL_USER_FILTERS),
        methods,
        onSearch: handleSearch,
        onReset: handleReset,
    }
}
