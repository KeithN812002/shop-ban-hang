import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import * as emailOutboxService from '../services/emailOutboxService'
import { mapSummaryToResponse, mapDetailToResponse } from '../services/mapper'
import type { EmailOutboxFilterRequest } from '../types'

export const emailOutboxKeys = {
    all: ['email-outbox-mgt'] as const,
    lists: () => [...emailOutboxKeys.all, 'list'] as const,
    list: (filters?: EmailOutboxFilterRequest) => [...emailOutboxKeys.lists(), filters] as const,
    details: () => [...emailOutboxKeys.all, 'detail'] as const,
    detail: (id: string) => [...emailOutboxKeys.details(), id] as const,
}

export const useEmailOutboxes = (filters: EmailOutboxFilterRequest, refreshTrigger?: number) => {
    return useQuery({
        queryKey: [...emailOutboxKeys.list(filters), refreshTrigger],
        queryFn: async () => {
            const result = await emailOutboxService.searchEmailOutbox(filters)
            return {
                ...result,
                items: result.items.map(mapSummaryToResponse),
            }
        },
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    })
}

export const useEmailOutboxById = (id: string | null, enabled = true) => {
    return useQuery({
        queryKey: id ? emailOutboxKeys.detail(id) : [],
        queryFn: async () => {
            const result = await emailOutboxService.fetchEmailOutboxDetail(id!)
            if (!result) return undefined
            return mapDetailToResponse(result)
        },
        enabled: enabled && !!id,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const useResendEmail = (onSuccessCallback?: () => void) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation<void, AxiosError<ApiError>, string | string[]>({
        mutationFn: async (idOrIds: string | string[]) => {
            if (Array.isArray(idOrIds)) {
                await emailOutboxService.resendEmailBulk(idOrIds)
            } else {
                await emailOutboxService.resendEmail(idOrIds)
            }
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailOutbox.messages.resendSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailOutboxKeys.lists() })
            onSuccessCallback?.()
        },
    })
}

export * from './useEmailOutboxFilters'
export * from './useEmailOutboxTableState'
export * from './useEmailOutboxMutations'
export * from './useEmailOutboxPage'
