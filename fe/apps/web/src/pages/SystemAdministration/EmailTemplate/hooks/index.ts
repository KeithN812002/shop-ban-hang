import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import * as emailTemplateService from '../services/emailTemplateService'
import type { EmailTemplateFilterRequest, EmailTemplateUpdateRequest } from '../types'
import type { EmailTemplateModuleType } from '../utils/emailTemplateScope'

// moduleType is part of the key so switching menus does not reuse the previous module's cache
export const emailTemplateKeys = {
    all: (moduleType: EmailTemplateModuleType) => ['email-template-mgt', moduleType] as const,
    lists: (moduleType: EmailTemplateModuleType) => [...emailTemplateKeys.all(moduleType), 'list'] as const,
    list: (moduleType: EmailTemplateModuleType, filters?: EmailTemplateFilterRequest) =>
        [...emailTemplateKeys.lists(moduleType), filters] as const,
    details: (moduleType: EmailTemplateModuleType) => [...emailTemplateKeys.all(moduleType), 'detail'] as const,
    detail: (moduleType: EmailTemplateModuleType, id: string) =>
        [...emailTemplateKeys.details(moduleType), id] as const,
}

export const useEmailTemplates = (
    moduleType: EmailTemplateModuleType,
    filters: EmailTemplateFilterRequest,
    refreshTrigger?: number,
) => {
    return useQuery({
        queryKey: [...emailTemplateKeys.list(moduleType, filters), refreshTrigger],
        queryFn: async () => {
            return await emailTemplateService.searchEmailTemplate(moduleType, filters)
        },
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData,
    })
}

export const useEmailTemplateById = (moduleType: EmailTemplateModuleType, id: string | null, enabled = true) => {
    return useQuery({
        queryKey: id ? emailTemplateKeys.detail(moduleType, id) : [],
        queryFn: async () => {
            const result = await emailTemplateService.fetchEmailTemplateDetail(moduleType, id!)
            return result || undefined
        },
        enabled: enabled && !!id,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const useUpdateEmailTemplate = (moduleType: EmailTemplateModuleType, onSuccessCallback?: () => void) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation<void, AxiosError<ApiError>, EmailTemplateUpdateRequest>({
        mutationFn: async data => {
            await emailTemplateService.updateEmailTemplate(moduleType, data)
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailTemplate.messages.updateSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
            onSuccessCallback?.()
        },
    })
}

export const useActiveEmailTemplate = (moduleType: EmailTemplateModuleType) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => emailTemplateService.activeEmailTemplate(moduleType, id),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailTemplate.messages.activeSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
        },
    })
}

export const useInactiveEmailTemplate = (moduleType: EmailTemplateModuleType) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => emailTemplateService.inactiveEmailTemplate(moduleType, id),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailTemplate.messages.inactiveSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
        },
    })
}

export const useActiveEmailTemplateBulk = (moduleType: EmailTemplateModuleType) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (ids: string[]) => emailTemplateService.activeEmailTemplateBulk(moduleType, ids),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailTemplate.messages.activeBulkSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
        },
    })
}

export const useInactiveEmailTemplateBulk = (moduleType: EmailTemplateModuleType) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (ids: string[]) => emailTemplateService.inactiveEmailTemplateBulk(moduleType, ids),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('emailTemplate.messages.inactiveBulkSuccess'),
            })
            queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
        },
    })
}

export * from './useEmailTemplateFilters'
export * from './useEmailTemplateTableState'
export * from './useEmailTemplateMutations'
export * from './useEmailTemplatePage'
