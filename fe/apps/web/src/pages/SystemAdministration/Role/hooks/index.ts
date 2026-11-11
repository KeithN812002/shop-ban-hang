import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import * as roleService from '../services/roleService'
import type { RoleFilterRequest, RoleCreateRequest, RoleUpdateRequest } from '../types'

export const roleKeys = {
    all: ['role-mgt'] as const,
    lists: () => [...roleKeys.all, 'list'] as const,
    list: (filters?: RoleFilterRequest) => [...roleKeys.lists(), filters] as const,
    details: () => [...roleKeys.all, 'detail'] as const,
    detail: (id: string) => [...roleKeys.details(), id] as const,
}

export const useRoles = (filters: RoleFilterRequest, refreshTrigger?: number) => {
    return useQuery({
        queryKey: [...roleKeys.list(filters), refreshTrigger],
        queryFn: () => roleService.searchRoles(filters),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const useRoleById = (id: string | null, enabled = true) => {
    return useQuery({
        queryKey: id ? roleKeys.detail(id) : [],
        queryFn: () => roleService.fetchRoleDetail(id!),
        enabled: enabled && !!id,
        staleTime: 0,
        gcTime: 0,
    })
}

export const useCreateRole = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: RoleCreateRequest) => roleService.createRole(data),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.createSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useUpdateRole = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: RoleUpdateRequest) => roleService.updateRole(data),
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.updateSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useDeleteRole = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.deleteRole,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.deleteSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useActiveRole = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.activeRole,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.activeSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useInactiveRole = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.inactiveRole,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.inactiveSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useActiveRoleBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.activeRoleBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.activeBulkSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useInactiveRoleBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.inactiveRoleBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.inactiveBulkSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export const useDeleteRoleBulk = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: roleService.deleteRoleBulk,
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('role.messages.deleteBulkSuccess'),
            })
        },
        meta: { invalidates: [roleKeys.lists()] },
    })
}

export * from './useRolePage'
export * from './useRoleFilters'
export * from './useRoleTableState'
export * from './useRoleMutations'
