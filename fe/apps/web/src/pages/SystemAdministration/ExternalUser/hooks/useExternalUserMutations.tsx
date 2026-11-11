import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { Trash2, Lock, Unlock, KeyRound } from 'lucide-react'
import {
    useCreateExternalUser,
    useUpdateExternalUser,
    useDeleteExternalUser,
    useActiveExternalUser,
    useInactiveExternalUser,
    useExternalUsers,
    useExternalUserById,
    useResetPassword,
    useResetPasswordBulk,
    useActiveExternalUserBulk,
    useInactiveExternalUserBulk,
    useDeleteExternalUserBulk,
    externalUserKeys,
} from './index'

import type {
    ExternalUserResponse,
    ExternalUserFormData,
    ExternalUserCreateRequest,
    ExternalUserUpdateRequest,
    ExternalUserFilterRequest,
} from '../types'

export const useExternalUserMutations = (filters: ExternalUserFilterRequest, refreshTrigger?: number) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [isFormOpenRequested, setIsFormOpenRequested] = useState(false)
    const [selectedRows, setSelectedRows] = useState<ExternalUserResponse[]>([])

    const usersQuery = useExternalUsers(filters, refreshTrigger)
    const detailQuery = useExternalUserById(
        selectedUserId ?? '',
        (isFormOpen && !!selectedUserId) || isFormOpenRequested,
    )
    const createMutation = useCreateExternalUser()
    const updateMutation = useUpdateExternalUser()
    const deleteMutation = useDeleteExternalUser()
    const activeMutation = useActiveExternalUser()
    const inactiveMutation = useInactiveExternalUser()
    const resetPasswordMutation = useResetPassword()
    const resetPasswordBulkMutation = useResetPasswordBulk()
    const activeBulkMutation = useActiveExternalUserBulk()
    const inactiveBulkMutation = useInactiveExternalUserBulk()
    const deleteBulkMutation = useDeleteExternalUserBulk()

    const handleDelete = useCallback(
        (user: ExternalUserResponse) => {
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
        (user: ExternalUserResponse) => {
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
        (user: ExternalUserResponse) => {
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

    const handleAdd = useCallback(() => {
        setSelectedUserId(null)
        setIsReadOnly(false)
        setIsFormOpen(true)
    }, [])

    const handleResetPassword = useCallback(
        (user: ExternalUserResponse) => {
            confirm({
                title: t('user.messages.confirmResetPasswordTitle'),
                description: t('user.messages.confirmResetPassword', { name: user.personalName }),
                variant: 'warning',
                action: {
                    label: t('common.confirm'),
                    icon: <KeyRound className="size-4" />,
                    onClick: () => {
                        resetPasswordMutation.mutate(user.id)
                    },
                },
            })
        },
        [resetPasswordMutation, t],
    )

    const handleResetPasswordBulk = useCallback(() => {
        const ids = selectedRows.map(row => row.id)
        if (ids.length === 0) return
        confirm({
            title: t('user.messages.confirmResetPasswordBulkTitle'),
            description: t('user.messages.confirmResetPasswordBulk', { count: ids.length }),
            variant: 'warning',
            action: {
                label: t('common.confirm'),
                icon: <KeyRound className="size-4" />,
                onClick: async () => {
                    await resetPasswordBulkMutation.mutateAsync(ids)
                    setSelectedRows([])
                },
            },
        })
    }, [selectedRows, resetPasswordBulkMutation, t])

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
        (user: ExternalUserResponse) => {
            queryClient.removeQueries({ queryKey: externalUserKeys.detail(user.id) })
            setSelectedUserId(user.id)
            setIsReadOnly(false)
            setIsFormOpenRequested(true)
        },
        [queryClient],
    )

    const handleView = useCallback(
        (user: ExternalUserResponse) => {
            queryClient.removeQueries({ queryKey: externalUserKeys.detail(user.id) })
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
        async (data: ExternalUserFormData) => {
            if (selectedUserId) {
                const updatePayload: ExternalUserUpdateRequest = {
                    id: selectedUserId,
                    personalName: data.personalName,
                    email: data.email ?? '',
                    status: data.status,
                    roles: data.roles,
                    externalUnitCode: data.externalUnitCode || null,
                }
                await updateMutation.mutateAsync(updatePayload)
            } else {
                const createPayload: ExternalUserCreateRequest = {
                    userName: data.userName,
                    personalName: data.personalName,
                    email: data.email ?? '',
                    status: data.status,
                    roles: data.roles,
                    externalUnitCode: data.externalUnitCode || null,
                }
                await createMutation.mutateAsync(createPayload)
            }
            handleClose()
        },
        [selectedUserId, updateMutation, createMutation, handleClose],
    )

    const isAnyMutationPending =
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        activeMutation.isPending ||
        inactiveMutation.isPending ||
        resetPasswordMutation.isPending ||
        resetPasswordBulkMutation.isPending ||
        activeBulkMutation.isPending ||
        inactiveBulkMutation.isPending ||
        deleteBulkMutation.isPending ||
        (detailQuery.isLoading && isFormOpenRequested)

    const loadingMessage: string = useMemo(() => {
        if (createMutation.isPending || updateMutation.isPending) return t('common.saving')
        if (deleteMutation.isPending) return t('common.deleting')
        if (
            activeMutation.isPending ||
            inactiveMutation.isPending ||
            resetPasswordMutation.isPending ||
            resetPasswordBulkMutation.isPending
        )
            return t('common.processing')
        return t('common.loading')
    }, [
        createMutation.isPending,
        updateMutation.isPending,
        deleteMutation.isPending,
        activeMutation.isPending,
        inactiveMutation.isPending,
        resetPasswordMutation.isPending,
        resetPasswordBulkMutation.isPending,
        t,
    ])

    return {
        usersQuery,
        detailQuery,
        isAnyMutationPending,
        loadingMessage,
        handleAdd,
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
        handleResetPassword,
        handleResetPasswordBulk,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
    }
}
