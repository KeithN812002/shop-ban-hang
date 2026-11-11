import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { Trash2, Lock, Unlock } from 'lucide-react'
import {
    useCreateRole,
    useUpdateRole,
    useDeleteRole,
    useActiveRole,
    useInactiveRole,
    useActiveRoleBulk,
    useInactiveRoleBulk,
    useDeleteRoleBulk,
    useRoles,
    useRoleById,
    roleKeys,
} from './index'

import type { RoleResponse, RoleCreateRequest, RoleUpdateRequest, RoleFilterRequest, RoleFormData } from '../types'

export const useRoleMutations = (filters: RoleFilterRequest, refreshTrigger?: number) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [isFormOpenRequested, setIsFormOpenRequested] = useState(false)
    const [selectedRows, setSelectedRows] = useState<RoleResponse[]>([])
    const rolesQuery = useRoles(filters, refreshTrigger)
    const detailQuery = useRoleById(selectedRoleId ?? null, isFormOpenRequested || isFormOpen)
    const createMutation = useCreateRole()
    const updateMutation = useUpdateRole()
    const deleteMutation = useDeleteRole()
    const activeMutation = useActiveRole()
    const inactiveMutation = useInactiveRole()
    const activeBulkMutation = useActiveRoleBulk()
    const inactiveBulkMutation = useInactiveRoleBulk()
    const deleteBulkMutation = useDeleteRoleBulk()

    const handleDelete = useCallback(
        (role: RoleResponse) => {
            confirm({
                title: t('common.confirmDeleteTitle'),
                description: t('role.messages.confirmDelete', { name: role.name }),
                variant: 'destructive',
                action: {
                    label: t('common.delete'),
                    icon: <Trash2 className="size-4" />,
                    onClick: async () => {
                        await deleteMutation.mutateAsync(role.id)
                    },
                },
            })
        },
        [deleteMutation, t],
    )

    const handleActive = useCallback(
        (role: RoleResponse) => {
            confirm({
                title: t('role.messages.confirmActiveTitle'),
                description: t('role.messages.confirmActive', { name: role.name }),
                action: {
                    label: t('common.active'),
                    icon: <Unlock className="size-4" />,
                    onClick: async () => {
                        await activeMutation.mutateAsync(role.id)
                    },
                },
            })
        },
        [activeMutation, t],
    )

    const handleInactive = useCallback(
        (role: RoleResponse) => {
            confirm({
                title: t('role.messages.confirmInactiveTitle'),
                description: t('role.messages.confirmInactive', { name: role.name }),
                variant: 'destructive',
                action: {
                    label: t('common.inactive'),
                    icon: <Lock className="size-4" />,
                    onClick: async () => {
                        await inactiveMutation.mutateAsync(role.id)
                    },
                },
            })
        },
        [inactiveMutation, t],
    )

    const handleActiveBulk = useCallback(() => {
        const ids = selectedRows.map(row => row.id)
        if (ids.length === 0) return
        confirm({
            title: t('role.messages.confirmActiveBulkTitle'),
            description: t('role.messages.confirmActiveBulk', { count: ids.length }),
            action: {
                label: t('common.active'),
                icon: <Unlock className="size-4" />,
                onClick: async () => {
                    await activeBulkMutation.mutateAsync(ids)
                    setSelectedRows([])
                },
            },
        })
    }, [selectedRows, activeBulkMutation, t])

    const handleInactiveBulk = useCallback(() => {
        const ids = selectedRows.map(row => row.id)
        if (ids.length === 0) return
        confirm({
            title: t('role.messages.confirmInactiveBulkTitle'),
            description: t('role.messages.confirmInactiveBulk', { count: ids.length }),
            variant: 'warning',
            action: {
                label: t('common.inactive'),
                icon: <Lock className="size-4" />,
                onClick: async () => {
                    await inactiveBulkMutation.mutateAsync(ids)
                    setSelectedRows([])
                },
            },
        })
    }, [selectedRows, inactiveBulkMutation, t])

    const handleDeleteBulk = useCallback(() => {
        const ids = selectedRows.map(row => row.id)
        if (ids.length === 0) return
        confirm({
            title: t('role.messages.confirmDeleteBulkTitle'),
            description: t('role.messages.confirmDeleteBulk', { count: ids.length }),
            variant: 'destructive',
            action: {
                label: t('common.delete'),
                icon: <Trash2 className="size-4" />,
                onClick: async () => {
                    await deleteBulkMutation.mutateAsync(ids)
                    setSelectedRows([])
                },
            },
        })
    }, [selectedRows, deleteBulkMutation, t])

    const handleAdd = useCallback(() => {
        setSelectedRoleId(null)
        setIsReadOnly(false)
        setIsFormOpen(true)
    }, [])

    const handleView = useCallback(
        (role: RoleResponse) => {
            queryClient.removeQueries({ queryKey: roleKeys.detail(role.id) })
            setSelectedRoleId(role.id)
            setIsReadOnly(true)
            setIsFormOpenRequested(true)
        },
        [queryClient],
    )

    const handleEdit = useCallback(
        (role: RoleResponse) => {
            queryClient.removeQueries({ queryKey: roleKeys.detail(role.id) })
            setSelectedRoleId(role.id)
            setIsReadOnly(false)
            setIsFormOpenRequested(true)
        },
        [queryClient],
    )

    useEffect(() => {
        if (isFormOpenRequested && detailQuery.isSuccess && !detailQuery.isFetching) {
            setIsFormOpen(true)
            setIsFormOpenRequested(false)
        }
    }, [isFormOpenRequested, detailQuery.isSuccess, detailQuery.isFetching])

    useEffect(() => {
        if (isFormOpenRequested && detailQuery.isError) {
            setIsFormOpenRequested(false)
            setSelectedRoleId(null)
        }
    }, [isFormOpenRequested, detailQuery.isError])

    const handleClose = useCallback(() => {
        setIsFormOpen(false)
        setIsFormOpenRequested(false)
    }, [])

    const handleFormSubmit = useCallback(
        async (data: RoleFormData) => {
            if (selectedRoleId) {
                const updatePayload: RoleUpdateRequest = {
                    ...data,
                    id: selectedRoleId,
                }
                await updateMutation.mutateAsync(updatePayload)
            } else {
                await createMutation.mutateAsync(data as RoleCreateRequest)
            }
            handleClose()
        },
        [selectedRoleId, updateMutation, createMutation, handleClose],
    )

    const isAnyMutationPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        activeMutation.isPending ||
        inactiveMutation.isPending ||
        activeBulkMutation.isPending ||
        inactiveBulkMutation.isPending ||
        deleteBulkMutation.isPending ||
        (detailQuery.isLoading && isFormOpenRequested)

    const loadingMessage: string = useMemo(() => {
        if (createMutation.isPending || updateMutation.isPending) return t('common.saving')
        if (deleteMutation.isPending || deleteBulkMutation.isPending) return t('common.deleting')
        if (
            activeMutation.isPending ||
            inactiveMutation.isPending ||
            activeBulkMutation.isPending ||
            inactiveBulkMutation.isPending
        )
            return t('common.processing')
        return t('common.loading')
    }, [
        createMutation.isPending,
        updateMutation.isPending,
        deleteMutation.isPending,
        activeMutation.isPending,
        inactiveMutation.isPending,
        activeBulkMutation.isPending,
        inactiveBulkMutation.isPending,
        deleteBulkMutation.isPending,
        t,
    ])

    return {
        rolesQuery,
        detailQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleEdit,
        handleDelete,
        handleActive,
        handleInactive,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        setSelectedRows,
        handleFormSubmit,
        handleClose,
        isFormOpen,
        setIsFormOpen,
        selectedRoleId,
        isReadOnly,
        handleAdd,
    }
}
