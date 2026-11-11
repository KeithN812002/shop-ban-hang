import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { Trash2, Lock, Unlock } from 'lucide-react'
import {
    useActiveInternalUser,
    useInactiveInternalUser,
    useDeleteInternalUser,
    useAssignInternalUserRoles,
    useActiveInternalUserBulk,
    useInactiveInternalUserBulk,
    useDeleteInternalUserBulk,
    useInternalUsers,
    useInternalUserById,
    internalUserKeys,
} from './index'

import type { InternalUserResponse, InternalUserFormData, InternalUserFilterRequest } from '../types'

export const useInternalUserMutations = (filters: InternalUserFilterRequest, refreshTrigger?: number) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [isFormOpenRequested, setIsFormOpenRequested] = useState(false)
    const [selectedRows, setSelectedRows] = useState<InternalUserResponse[]>([])

    const usersQuery = useInternalUsers(filters, refreshTrigger)
    const detailQuery = useInternalUserById(
        selectedUserId ?? '',
        (isFormOpen && !!selectedUserId) || isFormOpenRequested,
    )
    const activeMutation = useActiveInternalUser()
    const inactiveMutation = useInactiveInternalUser()
    const deleteMutation = useDeleteInternalUser()
    const assignRolesMutation = useAssignInternalUserRoles()
    const activeBulkMutation = useActiveInternalUserBulk()
    const inactiveBulkMutation = useInactiveInternalUserBulk()
    const deleteBulkMutation = useDeleteInternalUserBulk()

    const handleDelete = useCallback(
        (user: InternalUserResponse) => {
            confirm({
                title: t('common.confirmDeleteTitle'),
                description: t('user.messages.confirmDelete', {
                    name: `${user.personalName} (${user.userName})`,
                }),
                variant: 'destructive',
                action: {
                    label: t('common.delete'),
                    icon: <Trash2 className="size-4" />,
                    onClick: () => {
                        deleteMutation.mutate(user.id)
                    },
                },
            })
        },
        [deleteMutation, t],
    )

    const handleActive = useCallback(
        (user: InternalUserResponse) => {
            confirm({
                title: t('user.messages.confirmActiveTitle'),
                description: t('user.messages.confirmActive', { name: user.personalName }),
                action: {
                    label: t('common.active'),
                    icon: <Unlock className="size-4" />,
                    onClick: () => {
                        activeMutation.mutate(user.id)
                    },
                },
            })
        },
        [activeMutation, t],
    )

    const handleInactive = useCallback(
        (user: InternalUserResponse) => {
            confirm({
                title: t('user.messages.confirmInactiveTitle'),
                description: t('user.messages.confirmInactive', { name: user.personalName }),
                variant: 'warning',
                action: {
                    label: t('common.inactive'),
                    icon: <Lock className="size-4" />,
                    onClick: () => {
                        inactiveMutation.mutate(user.id)
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
            title: t('user.messages.confirmActiveBulkTitle'),
            description: t('user.messages.confirmActiveBulk', { count: ids.length }),
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
            title: t('user.messages.confirmInactiveBulkTitle'),
            description: t('user.messages.confirmInactiveBulk', { count: ids.length }),
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
            title: t('user.messages.confirmDeleteBulkTitle'),
            description: t('user.messages.confirmDeleteBulk', { count: ids.length }),
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

    const handleEdit = useCallback(
        (user: InternalUserResponse) => {
            queryClient.removeQueries({ queryKey: internalUserKeys.detail(user.id) })
            setSelectedUserId(user.id)
            setIsReadOnly(false)
            setIsFormOpenRequested(true)
        },
        [queryClient],
    )

    const handleView = useCallback(
        (user: InternalUserResponse) => {
            queryClient.removeQueries({ queryKey: internalUserKeys.detail(user.id) })
            setSelectedUserId(user.id)
            setIsReadOnly(true)
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
            setSelectedUserId(null)
        }
    }, [isFormOpenRequested, detailQuery.isError])

    const handleClose = useCallback(() => {
        setIsFormOpen(false)
        setIsFormOpenRequested(false)
    }, [])

    const handleFormSubmit = useCallback(
        async (data: InternalUserFormData) => {
            if (!selectedUserId) return
            await assignRolesMutation.mutateAsync({
                id: selectedUserId,
                roles: data.roles,
            })
            handleClose()
        },
        [selectedUserId, assignRolesMutation, handleClose],
    )

    const isAnyMutationPending =
        deleteMutation.isPending ||
        activeMutation.isPending ||
        inactiveMutation.isPending ||
        assignRolesMutation.isPending ||
        activeBulkMutation.isPending ||
        inactiveBulkMutation.isPending ||
        deleteBulkMutation.isPending ||
        (detailQuery.isLoading && isFormOpenRequested)

    const loadingMessage: string = useMemo(() => {
        if (assignRolesMutation.isPending) return t('common.saving')
        if (deleteMutation.isPending) return t('common.deleting')
        if (activeMutation.isPending || inactiveMutation.isPending) return t('common.processing')
        return t('common.loading')
    }, [
        assignRolesMutation.isPending,
        deleteMutation.isPending,
        activeMutation.isPending,
        inactiveMutation.isPending,
        t,
    ])

    return {
        usersQuery,
        detailQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleEdit,
        handleDelete,
        handleActive,
        handleInactive,
        handleFormSubmit,
        handleClose,
        isFormOpen,
        selectedUserId,
        isReadOnly,
        selectedRows,
        setSelectedRows,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
    }
}
