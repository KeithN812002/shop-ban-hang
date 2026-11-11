import { useCallback, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import { ACTION_CODES } from '../../constants'
import { markOrderRefunded, resolveReturn } from '../../services/shopAdminService'
import type { OrderResponse } from '../../types'
import type { RefundDialogProps } from '../components/RefundDialog'
import type { ResolveReturnDialogProps } from '../components/ResolveReturnDialog'
import { orderKeys } from './useOrderQueries'

export const RETURN_ACTION_IDS: ReadonlySet<string> = new Set([ACTION_CODES.resolveReturn, ACTION_CODES.markRefunded])

type ReturnActionId = typeof ACTION_CODES.resolveReturn | typeof ACTION_CODES.markRefunded

interface Target {
    id: ReturnActionId
    order: OrderResponse
}

const INVALIDATES = [orderKeys.all]

/** Dialog-driven return actions: `resolveReturn` (dispute decision) and `markRefunded` (manual refund record). */
export const useReturnActions = () => {
    const { t } = useTranslation()
    const [target, setTarget] = useState<Target | null>(null)

    const resolveMutation = useMutation({
        mutationFn: resolveReturn,
        onSuccess: () =>
            toast.success({
                title: t('common.success'),
                description: t('shopAdmin.order.messages.resolveReturnSuccess'),
            }),
        meta: { invalidates: INVALIDATES },
    })
    const refundMutation = useMutation({
        mutationFn: markOrderRefunded,
        onSuccess: () =>
            toast.success({
                title: t('common.success'),
                description: t('shopAdmin.order.messages.markRefundedSuccess'),
            }),
        meta: { invalidates: INVALIDATES },
    })

    const open = useCallback((id: string, order: OrderResponse) => {
        if (RETURN_ACTION_IDS.has(id)) setTarget({ id: id as ReturnActionId, order })
    }, [])
    const close = useCallback(() => setTarget(null), [])

    const resolveDialogProps = useMemo<ResolveReturnDialogProps>(
        () => ({
            isOpen: target?.id === ACTION_CODES.resolveReturn,
            orderCode: target?.order.code,
            isPending: resolveMutation.isPending,
            onClose: close,
            onSubmit: async ({ approve, note }) => {
                if (!target) return
                await resolveMutation.mutateAsync({ id: target.order.id, approve, note })
                setTarget(null)
            },
        }),
        [target, resolveMutation, close],
    )

    const refundDialogProps = useMemo<RefundDialogProps>(
        () => ({
            isOpen: target?.id === ACTION_CODES.markRefunded,
            orderCode: target?.order.code,
            isPending: refundMutation.isPending,
            onClose: close,
            onSubmit: async ({ proofImageUrl, note }) => {
                if (!target) return
                await refundMutation.mutateAsync({ id: target.order.id, proofImageUrl, note })
                setTarget(null)
            },
        }),
        [target, refundMutation, close],
    )

    return {
        open,
        resolveDialogProps,
        refundDialogProps,
        isPending: resolveMutation.isPending || refundMutation.isPending,
    }
}
