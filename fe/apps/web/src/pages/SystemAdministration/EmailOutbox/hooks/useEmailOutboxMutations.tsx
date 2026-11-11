import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { RotateCw } from 'lucide-react'
import { useEmailOutboxes, useEmailOutboxById, emailOutboxKeys, useResendEmail } from './index'
import type { EmailOutboxResponse, EmailOutboxFilterRequest } from '../types'

export const useEmailOutboxMutations = (
    filters: EmailOutboxFilterRequest,
    refreshTrigger?: number,
    onMutationSuccess?: () => void,
) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isFormOpenRequested, setIsFormOpenRequested] = useState(false)
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

    const emailOutboxesQuery = useEmailOutboxes(filters, refreshTrigger)
    const emailOutboxQuery = useEmailOutboxById(selectedEmailId, isFormOpenRequested || isFormOpen)

    const resendMutation = useResendEmail(() => {
        onMutationSuccess?.()
        handleClose()
    })

    const handleView = useCallback(
        (item: EmailOutboxResponse) => {
            queryClient.removeQueries({ queryKey: emailOutboxKeys.detail(item.id) })
            setSelectedEmailId(item.id)
            setIsFormOpenRequested(true)
        },
        [queryClient],
    )

    useEffect(() => {
        if (isFormOpenRequested && emailOutboxQuery.isSuccess && !emailOutboxQuery.isFetching) {
            setIsFormOpen(true)
            setIsFormOpenRequested(false)
        }
    }, [isFormOpenRequested, emailOutboxQuery.isSuccess, emailOutboxQuery.isFetching])

    useEffect(() => {
        if (isFormOpenRequested && emailOutboxQuery.isError) {
            setIsFormOpenRequested(false)
            setSelectedEmailId(null)
        }
    }, [isFormOpenRequested, emailOutboxQuery.isError])

    const handleClose = useCallback(() => {
        setIsFormOpen(false)
        setIsFormOpenRequested(false)
    }, [])

    const handleResend = useCallback(
        (idOrIds: string | string[]) => {
            const isBulk = Array.isArray(idOrIds)
            confirm({
                title: isBulk
                    ? t('emailOutbox.messages.confirmResendBulkTitle')
                    : t('emailOutbox.messages.confirmResendTitle'),
                description: isBulk
                    ? t('emailOutbox.messages.confirmResendBulkDescription')
                    : t('emailOutbox.messages.confirmResendDescription'),
                variant: 'warning',
                action: {
                    label: isBulk ? t('emailOutbox.actions.resendBulk') : t('emailOutbox.actions.resend'),
                    icon: <RotateCw className="size-4" />,
                    onClick: () => {
                        resendMutation.mutate(idOrIds)
                    },
                },
            })
        },
        [resendMutation, t],
    )

    const isAnyMutationPending = (emailOutboxQuery.isLoading && isFormOpenRequested) || resendMutation.isPending

    const loadingMessage: string = useMemo(() => {
        return t('common.loading')
    }, [t])

    return {
        emailOutboxesQuery,
        emailOutboxQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleClose,
        handleResend,
        isFormOpen,
        setIsFormOpen,
        selectedEmailId,
    }
}

useEmailOutboxMutations.displayName = 'useEmailOutboxMutations'
