import { useMemo } from 'react'
import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import { menuKeys } from '@/providers/MenuDataProvider'
import * as permissionService from '../services/permissionService'
import { buildPermissionTree } from '../services/mapper'
import type { PermissionCreateRequest, PermissionImportApplyScope, PermissionUpdateRequest } from '../types'

export const permissionKeys = {
    all: ['permission-crud'] as const,
    lists: () => [...permissionKeys.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...permissionKeys.lists(), filters] as const,
    details: () => [...permissionKeys.all, 'detail'] as const,
    detail: (id: string) => [...permissionKeys.details(), id] as const,
    activeForRole: () => [...permissionKeys.all, 'active-for-role'] as const,
    byCode: (code: string) => [...permissionKeys.all, 'code', code] as const,
}

export const usePermissions = (refreshTrigger?: number) => {
    return useQuery({
        queryKey: [...permissionKeys.lists(), refreshTrigger],
        queryFn: permissionService.fetchAllPermissions,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const useActivePermissionsForRole = (enabled = true) => {
    return useQuery({
        queryKey: permissionKeys.activeForRole(),
        queryFn: permissionService.fetchActivePermissionsForRole,
        enabled,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
    })
}

export const usePermissionById = (id: string, enabled = true) => {
    return useQuery({
        queryKey: permissionKeys.detail(id),
        queryFn: () => permissionService.fetchPermissionDetail(id),
        enabled: enabled && !!id,
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnMount: 'always',
    })
}

export const usePermissionTree = () => {
    const { data: permissions } = usePermissions()

    const tree = useMemo(() => {
        return permissions ? buildPermissionTree(permissions) : []
    }, [permissions])

    return { tree }
}

export const useCreatePermission = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: PermissionCreateRequest) => permissionService.createPermission(data),
        meta: {
            invalidates: [permissionKeys.lists()],
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('permission.messages.createSuccess'),
            })
        },
    })
}

export const useUpdatePermission = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (data: PermissionUpdateRequest) => permissionService.updatePermission(data),
        meta: {
            invalidates: [permissionKeys.lists()],
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('permission.messages.updateSuccess'),
            })
        },
    })
}

export const useDeletePermission = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: (id: string) => permissionService.deletePermission(id),
        meta: {
            invalidates: [permissionKeys.lists()],
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('permission.messages.deleteSuccess'),
            })
        },
    })
}

export const useExportPermissions = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: permissionService.downloadPermissionExport,
        meta: {
            invalidates: [],
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('permission.messages.exportSuccess'),
            })
        },
    })
}

export const usePreviewPermissionImport = () => {
    return useMutation({
        mutationFn: (file: File) => permissionService.previewPermissionImport(file),
        meta: {
            invalidates: [],
        },
    })
}

export const useApplyPermissionImport = () => {
    const { t } = useTranslation()

    return useMutation({
        mutationFn: ({
            file,
            confirmDeleteCount,
            scope,
        }: {
            file: File
            confirmDeleteCount: number
            scope: PermissionImportApplyScope
        }) => permissionService.applyPermissionImport(file, confirmDeleteCount, scope),
        meta: {
            invalidates: [permissionKeys.all, menuKeys.all],
        },
        onSuccess: () => {
            toast.success({
                title: t('common.success'),
                description: t('permission.messages.importSuccess'),
            })
        },
    })
}

export const useCheckCodeExists = () => {
    return useMutation({
        mutationFn: ({ code }: { code: string }) =>
            permissionService.fetchAllPermissions().then(data => data.some(permission => permission.code === code)),
        meta: {
            invalidates: [],
        },
    })
}

export * from './usePermissionPage'
export * from './usePermissionTreeState'
export * from './usePermissionMutations'
