import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { EmailOutboxFilterRequest } from '../types'
import { hasActiveFilters, keepPageSize, keepTableState } from '@/utils/filter.utils'

export interface EmailOutboxFilterForm extends Omit<
    EmailOutboxFilterRequest,
    'createdDateFrom' | 'createdDateTo' | 'updatedDateFrom' | 'updatedDateTo' | 'sentAtFrom' | 'sentAtTo'
> {
    createdDateRange?: { start?: string; end?: string }
    updatedDateRange?: { start?: string; end?: string }
    sentAtRange?: { start?: string; end?: string }
}

export const DEFAULT_EMAIL_OUTBOX_FILTERS: EmailOutboxFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    eventType: [],
    subject: '',
    receiver: '',
    status: [],
    retryCountFrom: undefined,
    retryCountTo: undefined,
    createdBy: '',
    createdDateFrom: '',
    createdDateTo: '',
    updatedBy: '',
    updatedDateFrom: '',
    updatedDateTo: '',
    sentAtFrom: '',
    sentAtTo: '',
}

export const DEFAULT_EMAIL_OUTBOX_FORM_VALUES: EmailOutboxFilterForm = {
    ...DEFAULT_EMAIL_OUTBOX_FILTERS,
    createdDateRange: { start: undefined, end: undefined },
    updatedDateRange: { start: undefined, end: undefined },
    sentAtRange: { start: undefined, end: undefined },
}

export const useEmailOutboxFilters = (onFilterChange?: (filters: EmailOutboxFilterRequest) => void) => {
    const [filters, setFilters] = useState<EmailOutboxFilterRequest>(DEFAULT_EMAIL_OUTBOX_FILTERS)

    const methods = useForm<EmailOutboxFilterForm>({
        defaultValues: DEFAULT_EMAIL_OUTBOX_FORM_VALUES,
        mode: 'onChange',
    })

    const { reset } = methods

    const handleSearch = (data: EmailOutboxFilterForm) => {
        const { createdDateRange, updatedDateRange, sentAtRange, ...rest } = data

        const searchFilters: EmailOutboxFilterRequest = keepTableState(filters, {
            ...filters,
            ...rest,
            pageNumber: 1,
            createdDateFrom: createdDateRange?.start ? `${createdDateRange.start}T00:00:00` : '',
            createdDateTo: createdDateRange?.end ? `${createdDateRange.end}T23:59:59` : '',
            updatedDateFrom: updatedDateRange?.start ? `${updatedDateRange.start}T00:00:00` : '',
            updatedDateTo: updatedDateRange?.end ? `${updatedDateRange.end}T23:59:59` : '',
            sentAtFrom: sentAtRange?.start ? `${sentAtRange.start}T00:00:00` : '',
            sentAtTo: sentAtRange?.end ? `${sentAtRange.end}T23:59:59` : '',
        })
        setFilters(searchFilters)
        onFilterChange?.(searchFilters)
    }

    const handleReset = () => {
        reset(DEFAULT_EMAIL_OUTBOX_FORM_VALUES)
        const nextFilters = keepPageSize(filters, DEFAULT_EMAIL_OUTBOX_FILTERS)
        setFilters(nextFilters)
        onFilterChange?.(nextFilters)
    }

    return {
        filters,
        setFilters,
        hasActiveFilter: hasActiveFilters(filters, DEFAULT_EMAIL_OUTBOX_FILTERS),
        methods,
        onSearch: handleSearch,
        onReset: handleReset,
    }
}
