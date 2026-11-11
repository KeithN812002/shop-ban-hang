import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ExternalUserFilterRequest } from '../types'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

export interface ExternalUserFilterForm extends Omit<
    ExternalUserFilterRequest,
    'createdDateFrom' | 'createdDateTo' | 'updatedDateFrom' | 'updatedDateTo' | 'externalUnitCode'
> {
    externalUnitCode?: string
    createdDateRange?: { start?: string; end?: string }
    updatedDateRange?: { start?: string; end?: string }
}

export const DEFAULT_EXTERNAL_USER_FILTERS: ExternalUserFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    userName: '',
    personalName: '',
    email: '',
    status: [],
    externalUnitCode: [],
    createdBy: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedBy: '',
    updatedDateFrom: '',
    updatedDateTo: '',
}

export const DEFAULT_EXTERNAL_USER_FORM_VALUES: ExternalUserFilterForm = {
    ...DEFAULT_EXTERNAL_USER_FILTERS,
    externalUnitCode: '',
    createdDateRange: { start: undefined, end: undefined },
    updatedDateRange: { start: undefined, end: undefined },
}

export const useExternalUserFilters = (onFilterChange?: (filters: ExternalUserFilterRequest) => void) => {
    const [filters, setFilters] = useState<ExternalUserFilterRequest>(DEFAULT_EXTERNAL_USER_FILTERS)

    const methods = useForm<ExternalUserFilterForm>({
        defaultValues: DEFAULT_EXTERNAL_USER_FORM_VALUES,
    })

    const { reset } = methods

    const handleSearch = (data: ExternalUserFilterForm) => {
        const { createdDateRange, updatedDateRange, externalUnitCode, ...rest } = data

        const searchFilters: ExternalUserFilterRequest = keepTableState(filters, {
            ...filters,
            ...rest,
            externalUnitCode: externalUnitCode?.trim() ? [externalUnitCode.trim()] : [],
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
        reset(DEFAULT_EXTERNAL_USER_FORM_VALUES)
        const nextFilters = keepPageSize(filters, DEFAULT_EXTERNAL_USER_FILTERS)
        setFilters(nextFilters)
        onFilterChange?.(nextFilters)
    }

    return {
        filters,
        setFilters,
        hasActiveFilter: hasActiveFilters(filters, DEFAULT_EXTERNAL_USER_FILTERS),
        methods,
        onSearch: handleSearch,
        onReset: handleReset,
    }
}
