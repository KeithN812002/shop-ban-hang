import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import * as api from '../services/externalUserService'
import { mapSummaryToResponse, mapDetailToResponse } from '../services/mapper'
import type { ExternalUserFilterRequest, ExternalUserCreateRequest, ExternalUserUpdateRequest } from '../types'

export const externalUserKeys = {
    all: ['external-user-mgt'] as const,
    lists: () => [...externalUserKeys.all, 'list'] as const,
    list: (filters?: ExternalUserFilterRequest) => [...externalUserKeys.lists(), filters] as const,
    details: () => [...externalUserKeys.all, 'detail'] as const,
    detail: (id: string) => [...externalUserKeys.details(), id] as const,
}

export const useExternalUsers = (filters: ExternalUserFilterRequest, refreshTrigger?: number) => {
    return useQuery({
        queryKey: [...externalUserKeys.list(filters), refreshTrigger],
        queryFn: async () => {
            const result = await api.searchExternalUsers(filters)
            return {
                ...result,
                items: result.items.map(mapSummaryToResponse),
            }
        },
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const useExternalUserById = (id: string | null, enabled = true) => {
    return useQuery({
        queryKey: id ? externalUserKeys.detail(id) : [],
        queryFn: async () => {
            const result = await api.fetchExternalUserDetail(id!)
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

export const useCreateExternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: ExternalUserCreateRequest) => api.createExternalUser(data),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.createSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useUpdateExternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: ExternalUserUpdateRequest) => api.updateExternalUser(data),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.updateSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useDeleteExternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.deleteExternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.deleteSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useActiveExternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.activeExternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.activeSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useInactiveExternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.inactiveExternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.inactiveSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useActiveExternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.activeExternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.activeBulkSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useInactiveExternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.inactiveExternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.inactiveBulkSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useDeleteExternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.deleteExternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.deleteBulkSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useResetPassword = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.resetPassword,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.resetPasswordSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export const useResetPasswordBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.resetPasswordBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.resetPasswordBulkSuccess'),
            })
        },
        meta: { invalidates: [externalUserKeys.lists()] },
    })
}

export * from './useExternalUserPage'
export * from './useExternalUserFilters'
export * from './useExternalUserTableState'
export * from './useExternalUserMutations'
