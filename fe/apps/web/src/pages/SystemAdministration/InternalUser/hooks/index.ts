import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import * as api from '../services/internalUserService'
import { mapSummaryToResponse, mapDetailToResponse } from '../services/mapper'
import type { InternalUserFilterRequest, InternalUserAssignRoleRequest } from '../types'

export const internalUserKeys = {
    all: ['internal-user-mgt'] as const,
    lists: () => [...internalUserKeys.all, 'list'] as const,
    list: (filters?: InternalUserFilterRequest) => [...internalUserKeys.lists(), filters] as const,
    details: () => [...internalUserKeys.all, 'detail'] as const,
    detail: (id: string) => [...internalUserKeys.details(), id] as const,
}

export const useInternalUsers = (filters: InternalUserFilterRequest, refreshTrigger?: number) => {
    return useQuery({
        queryKey: [...internalUserKeys.list(filters), refreshTrigger],
        queryFn: async () => {
            const result = await api.searchInternalUsers(filters)
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

export const useInternalUserById = (id: string | null, enabled = true) => {
    return useQuery({
        queryKey: id ? internalUserKeys.detail(id) : [],
        queryFn: async () => {
            const result = await api.fetchInternalUserDetail(id!)
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

export const useAssignInternalUserRoles = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: InternalUserAssignRoleRequest) => api.assignInternalUserRoles(data),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.updateSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useActiveInternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.activeInternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.activeSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useInactiveInternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.inactiveInternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.inactiveSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useDeleteInternalUser = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.deleteInternalUser,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.deleteSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useActiveInternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.activeInternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.activeBulkSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useInactiveInternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.inactiveInternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.inactiveBulkSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export const useDeleteInternalUserBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: api.deleteInternalUserBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('user.messages.deleteBulkSuccess'),
            })
        },
        meta: { invalidates: [internalUserKeys.lists()] },
    })
}

export * from './useInternalUserPage'
export * from './useInternalUserFilters'
export * from './useInternalUserTableState'
export * from './useInternalUserMutations'
