import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { Lock, Unlock } from 'lucide-react'
import {
    useEmailTemplates,
    useEmailTemplateById,
    emailTemplateKeys,
    useUpdateEmailTemplate,
    useActiveEmailTemplate,
    useInactiveEmailTemplate,
    useActiveEmailTemplateBulk,
    useInactiveEmailTemplateBulk,
} from './index'
import type { EmailTemplateResponse, EmailTemplateFilterRequest, EmailTemplateUpdateRequest } from '../types'
import type { EmailTemplateModuleType } from '../utils/emailTemplateScope'

export const useEmailTemplateMutations = (
    moduleType: EmailTemplateModuleType,
    filters: EmailTemplateFilterRequest,
    refreshTrigger?: number,
    onMutationSuccess?: () => void,
) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isFormOpenRequested, setIsFormOpenRequested] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)

    const [selectedRows, setSelectedRows] = useState<EmailTemplateResponse[]>([])

    const emailTemplatesQuery = useEmailTemplates(moduleType, filters, refreshTrigger)
    const emailTemplateQuery = useEmailTemplateById(moduleType, selectedTemplateId, isFormOpenRequested || isFormOpen)

    const updateMutation = useUpdateEmailTemplate(moduleType, () => {
        onMutationSuccess?.()
        handleClose()
        queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists(moduleType) })
    })
    const activeMutation = useActiveEmailTemplate(moduleType)
    const inactiveMutation = useInactiveEmailTemplate(moduleType)
    const activeBulkMutation = useActiveEmailTemplateBulk(moduleType)
    const inactiveBulkMutation = useInactiveEmailTemplateBulk(moduleType)

    const buildConfirmName = useCallback(
        (item: EmailTemplateResponse) => {
            const eventLabel = item.eventType
                ? t(`emailOutbox.eventType.${item.eventType}` as never, item.eventType)
                : ''
            return item.subjectTemplate ? `${eventLabel} - ${item.subjectTemplate}` : eventLabel
        },
        [t],
    )

    const handleActive = useCallback(
        (item: EmailTemplateResponse) => {
            confirm({
                title: t('emailTemplate.messages.confirmActiveTitle'),
                description: t('emailTemplate.messages.confirmActive', {
                    name: buildConfirmName(item) as never,
                }),
                action: {
                    label: t('common.active'),
                    icon: <Unlock className="size-4" />,
                    onClick: async () => {
                        await activeMutation.mutateAsync(item.id)
                    },
                },
            })
        },
        [activeMutation, buildConfirmName, t],
    )

    const handleInactive = useCallback(
        (item: EmailTemplateResponse) => {
            confirm({
                title: t('emailTemplate.messages.confirmInactiveTitle'),
                description: t('emailTemplate.messages.confirmInactive', {
                    name: buildConfirmName(item) as never,
                }),
                variant: 'destructive',
                action: {
                    label: t('common.inactive'),
                    icon: <Lock className="size-4" />,
                    onClick: async () => {
                        await inactiveMutation.mutateAsync(item.id)
                    },
                },
            })
        },
        [buildConfirmName, inactiveMutation, t],
    )

    const handleView = useCallback(
        (item: EmailTemplateResponse, edit = false) => {
            queryClient.removeQueries({ queryKey: emailTemplateKeys.detail(moduleType, item.id) })
            setSelectedTemplateId(item.id)
            setIsEditMode(edit)
            setIsFormOpenRequested(true)
        },
        [queryClient, moduleType],
    )

    useEffect(() => {
        if (isFormOpenRequested && emailTemplateQuery.isSuccess && !emailTemplateQuery.isFetching) {
            setIsFormOpen(true)
            setIsFormOpenRequested(false)
        }
    }, [isFormOpenRequested, emailTemplateQuery.isSuccess, emailTemplateQuery.isFetching])

    useEffect(() => {
        if (isFormOpenRequested && emailTemplateQuery.isError) {
            setIsFormOpenRequested(false)
            setSelectedTemplateId(null)
        }
    }, [isFormOpenRequested, emailTemplateQuery.isError])

    const handleClose = useCallback(() => {
        setIsFormOpen(false)
        setIsFormOpenRequested(false)
    }, [])

    const handleUpdate = useCallback(
        (data: EmailTemplateUpdateRequest) => {
            updateMutation.mutate(data)
        },
        [updateMutation],
    )

    const handleActiveBulk = useCallback(() => {
        const ids = selectedRows.map(row => row.id)
        if (ids.length === 0) return
        confirm({
            title: t('emailTemplate.messages.confirmActiveBulkTitle'),
            description: t('emailTemplate.messages.confirmActiveBulk', { count: ids.length }),
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
            title: t('emailTemplate.messages.confirmInactiveBulkTitle'),
            description: t('emailTemplate.messages.confirmInactiveBulk', { count: ids.length }),
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

    const isAnyMutationPending =
        (emailTemplateQuery.isLoading && isFormOpenRequested) ||
        updateMutation.isPending ||
        activeMutation.isPending ||
        inactiveMutation.isPending ||
        activeBulkMutation.isPending ||
        inactiveBulkMutation.isPending

    const loadingMessage: string = useMemo(() => {
        if (
            activeMutation.isPending ||
            inactiveMutation.isPending ||
            activeBulkMutation.isPending ||
            inactiveBulkMutation.isPending
        )
            return t('common.processing')
        return t('common.loading')
    }, [
        activeMutation.isPending,
        inactiveMutation.isPending,
        activeBulkMutation.isPending,
        inactiveBulkMutation.isPending,
        t,
    ])

    return {
        emailTemplatesQuery,
        emailTemplateQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleClose,
        handleUpdate,
        handleActive,
        handleInactive,
        handleActiveBulk,
        handleInactiveBulk,
        selectedRows,
        setSelectedRows,
        isFormOpen,
        setIsFormOpen,
        selectedTemplateId,
        isEditMode,
        setIsEditMode,
    }
}
