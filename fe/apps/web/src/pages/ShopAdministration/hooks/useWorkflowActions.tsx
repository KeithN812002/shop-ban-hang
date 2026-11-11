import { useCallback, useMemo, useState } from 'react'
import { useMutation, type QueryKey } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { toast } from '@workspace/ui/components/Sonner'
import type { ModerationRequest } from '../types'
import type { ReasonDialogProps } from '../components/ReasonDialog'

export interface WorkflowAction {
    /** Matches the backend function-permission code (`approve`, `reject`, `suspend`, ...). */
    id: string
    icon: LucideIcon
    variant?: 'default' | 'warning' | 'destructive'
    /** Ask for a mandatory reason in a dialog instead of a plain confirmation. */
    withReason?: boolean
    execute: (payload: ModerationRequest) => Promise<void>
    confirmTitle: ParseKeys
    /** May use `{{name}}`. */
    confirmDescription: ParseKeys
    confirmLabel: ParseKeys
    successMessage: ParseKeys
}

interface UseWorkflowActionsOptions<TRow extends { id: string }> {
    actions: WorkflowAction[]
    getName: (row: TRow) => string
    invalidates: QueryKey[]
}

interface PendingReason<TRow> {
    action: WorkflowAction
    row: TRow
}

/**
 * Confirm / reason-dialog / mutate / toast / invalidate flow shared by the approve-reject-suspend style
 * moderation actions (store, shipper, product ban, order cancel).
 */
export const useWorkflowActions = <TRow extends { id: string }>({
    actions,
    getName,
    invalidates,
}: UseWorkflowActionsOptions<TRow>) => {
    const { t } = useTranslation()
    const [pendingReason, setPendingReason] = useState<PendingReason<TRow> | null>(null)

    const actionById = useMemo(() => new Map(actions.map(action => [action.id, action])), [actions])

    const mutation = useMutation({
        mutationFn: ({ action, row, reason }: { action: WorkflowAction; row: TRow; reason?: string }) =>
            action.execute({ id: row.id, reason }),
        onSuccess: (_data, { action }) => {
            toast.success({ title: t('common.success'), description: t(action.successMessage) })
        },
        meta: { invalidates },
    })
    const { mutateAsync } = mutation

    const run = useCallback(
        (actionId: string, row: TRow) => {
            const action = actionById.get(actionId)
            if (!action) return
            if (action.withReason) {
                setPendingReason({ action, row })
                return
            }
            const Icon = action.icon
            confirm({
                title: t(action.confirmTitle),
                description: t(action.confirmDescription, { name: getName(row) }),
                variant: action.variant,
                action: {
                    label: t(action.confirmLabel),
                    icon: <Icon className="size-4" />,
                    onClick: async () => {
                        await mutateAsync({ action, row })
                    },
                },
            })
        },
        [actionById, getName, mutateAsync, t],
    )

    const closeReason = useCallback(() => setPendingReason(null), [])

    const reasonDialogProps = useMemo<ReasonDialogProps>(() => {
        const target = pendingReason
        return {
            isOpen: !!target,
            title: target ? t(target.action.confirmTitle) : '',
            description: target ? t(target.action.confirmDescription, { name: getName(target.row) }) : undefined,
            confirmLabel: target ? t(target.action.confirmLabel) : '',
            confirmIcon: target?.action.icon,
            confirmVariant: target?.action.variant ?? 'destructive',
            isPending: mutation.isPending,
            onClose: closeReason,
            onSubmit: async (reason: string) => {
                if (!target) return
                await mutateAsync({ action: target.action, row: target.row, reason })
                setPendingReason(null)
            },
        }
    }, [pendingReason, t, getName, mutation.isPending, closeReason, mutateAsync])

    return { run, reasonDialogProps, isPending: mutation.isPending }
}
