import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EmailTemplateFilterRequest } from '../types'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

export interface EmailTemplateFilterForm extends Omit<
    EmailTemplateFilterRequest,
    'createdDateFrom' | 'createdDateTo' | 'updatedDateFrom' | 'updatedDateTo'
> {
    createdDateRange?: { start?: string; end?: string }
    updatedDateRange?: { start?: string; end?: string }
}

export const DEFAULT_EMAIL_TEMPLATE_FILTERS: EmailTemplateFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    eventType: [],
    subjectTemplate: '',
    status: [],
    createdBy: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedBy: '',
    updatedDateFrom: '',
    updatedDateTo: '',
}

export const DEFAULT_EMAIL_TEMPLATE_FORM_VALUES: EmailTemplateFilterForm = {
    ...DEFAULT_EMAIL_TEMPLATE_FILTERS,
    createdDateRange: { start: undefined, end: undefined },
    updatedDateRange: { start: undefined, end: undefined },
}

export const useEmailTemplateFilters = (onFilterChange?: (filters: EmailTemplateFilterRequest) => void) => {
    const [filters, setFilters] = useState<EmailTemplateFilterRequest>(DEFAULT_EMAIL_TEMPLATE_FILTERS)

    const methods = useForm<EmailTemplateFilterForm>({
        defaultValues: DEFAULT_EMAIL_TEMPLATE_FORM_VALUES,
        mode: 'onChange',
    })

    const { reset } = methods

    const handleSearch = (data: EmailTemplateFilterForm) => {
        const { createdDateRange, updatedDateRange, ...rest } = data

        const searchFilters: EmailTemplateFilterRequest = keepTableState(filters, {
            ...filters,
            ...rest,
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
        reset(DEFAULT_EMAIL_TEMPLATE_FORM_VALUES)
        const nextFilters = keepPageSize(filters, DEFAULT_EMAIL_TEMPLATE_FILTERS)
        setFilters(nextFilters)
        onFilterChange?.(nextFilters)
    }

    return {
        filters,
        setFilters,
        hasActiveFilter: hasActiveFilters(filters, DEFAULT_EMAIL_TEMPLATE_FILTERS),
        methods,
        onSearch: handleSearch,
        onReset: handleReset,
    }
}
