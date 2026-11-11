import { Ban, Check, Pause, Unlock } from 'lucide-react'
import type { ModerationRequest } from '../types'
import type { WorkflowAction } from './useWorkflowActions'

export type ModerationEntity = 'store' | 'shipper'

interface ModerationApi {
    approve: (payload: ModerationRequest) => Promise<void>
    reject: (payload: ModerationRequest) => Promise<void>
    suspend: (payload: ModerationRequest) => Promise<void>
    reactivate: (payload: ModerationRequest) => Promise<void>
}

/** Approve / reject / suspend / reactivate flow common to store and shipper registrations. */
export const buildModerationActions = (entity: ModerationEntity, api: ModerationApi): WorkflowAction[] => [
    {
        id: 'approve',
        icon: Check,
        execute: api.approve,
        confirmTitle: `shopAdmin.${entity}.confirm.approveTitle`,
        confirmDescription: `shopAdmin.${entity}.confirm.approve`,
        confirmLabel: 'shopAdmin.actions.approve',
        successMessage: `shopAdmin.${entity}.messages.approveSuccess`,
    },
    {
        id: 'reject',
        icon: Ban,
        variant: 'destructive',
        withReason: true,
        execute: api.reject,
        confirmTitle: `shopAdmin.${entity}.confirm.rejectTitle`,
        confirmDescription: `shopAdmin.${entity}.confirm.reject`,
        confirmLabel: 'shopAdmin.actions.reject',
        successMessage: `shopAdmin.${entity}.messages.rejectSuccess`,
    },
    {
        id: 'suspend',
        icon: Pause,
        variant: 'warning',
        withReason: true,
        execute: api.suspend,
        confirmTitle: `shopAdmin.${entity}.confirm.suspendTitle`,
        confirmDescription: `shopAdmin.${entity}.confirm.suspend`,
        confirmLabel: 'shopAdmin.actions.suspend',
        successMessage: `shopAdmin.${entity}.messages.suspendSuccess`,
    },
    {
        id: 'reactivate',
        icon: Unlock,
        execute: api.reactivate,
        confirmTitle: `shopAdmin.${entity}.confirm.reactivateTitle`,
        confirmDescription: `shopAdmin.${entity}.confirm.reactivate`,
        confirmLabel: 'shopAdmin.actions.reactivate',
        successMessage: `shopAdmin.${entity}.messages.reactivateSuccess`,
    },
]
