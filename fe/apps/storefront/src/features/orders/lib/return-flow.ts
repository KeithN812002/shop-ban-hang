import type { OrderStatus, ReturnRequestResponse, ReturnRequestStatus } from '@/types/shop'

/** Buyer-facing progress of a return, in order (contract §12.1). */
export const RETURN_STEP_KEYS = ['requested', 'approved', 'shipping', 'received', 'refunded'] as const
export type ReturnStepKey = (typeof RETURN_STEP_KEYS)[number]
export type ReturnStepState = 'done' | 'current' | 'blocked' | 'todo'

export interface ReturnStep {
    key: ReturnStepKey
    state: ReturnStepState
}

/** Steps already completed once the order reaches a status (the next one is the current step). */
const DONE_COUNT: Partial<Record<OrderStatus, number>> = {
    RETURN_REQUESTED: 1,
    RETURN_APPROVED: 2,
    RETURN_SHIPPING: 3,
    RETURN_RECEIVED: 4,
    REFUNDED: 5,
}

/** Whether the order is somewhere inside the return flow (a stepper makes sense). */
export const isReturnOrderStatus = (status: OrderStatus): boolean => DONE_COUNT[status] !== undefined

/**
 * Stepper model. While the seller's answer is pending the 2nd step is current; once the seller rejected
 * or the buyer disputed, that step is `blocked` (the flow cannot move until the dispute is settled).
 * Returns [] when the order is outside the return flow (withdrawn / closed requests have no progress).
 */
export const computeReturnSteps = (status: OrderStatus, requestStatus?: ReturnRequestStatus | null): ReturnStep[] => {
    const done = DONE_COUNT[status]
    if (done === undefined) return []
    const stalled = status === 'RETURN_REQUESTED' && (requestStatus === 'REJECTED' || requestStatus === 'DISPUTED')
    return RETURN_STEP_KEYS.map((key, index) => ({
        key,
        state: index < done ? 'done' : index === done ? (stalled ? 'blocked' : 'current') : 'todo',
    }))
}

const isFuture = (iso: string | null | undefined, now: number): boolean => {
    if (!iso) return true // no deadline sent: let the server decide
    const time = new Date(iso).getTime()
    return Number.isNaN(time) || time > now
}

/** Buyer may withdraw while the request is waiting for the seller or after the seller rejected it. */
export const canWithdrawReturn = (status: OrderStatus, request: Pick<ReturnRequestResponse, 'status'>): boolean =>
    status === 'RETURN_REQUESTED' && (request.status === 'REQUESTED' || request.status === 'REJECTED')

/** Buyer may dispute a rejection until the dispute deadline. */
export const canDisputeReturn = (
    status: OrderStatus,
    request: Pick<ReturnRequestResponse, 'status' | 'disputeDeadline'>,
    now: number = Date.now(),
): boolean => status === 'RETURN_REQUESTED' && request.status === 'REJECTED' && isFuture(request.disputeDeadline, now)

/** Seller can answer a request that is still waiting. */
export const canSellerRespond = (status: OrderStatus, request: Pick<ReturnRequestResponse, 'status'>): boolean =>
    status === 'RETURN_REQUESTED' && request.status === 'REQUESTED'

/** History action codes produced by the return flow (labelled in the locale files). */
export const RETURN_HISTORY_ACTIONS = [
    'RETURN_REQUEST',
    'RETURN_APPROVE',
    'RETURN_AUTO_APPROVE',
    'RETURN_REJECT',
    'RETURN_DISPUTE',
    'RETURN_RESOLVE_APPROVE',
    'RETURN_RESOLVE_REJECT',
    'RETURN_WITHDRAW',
    'RETURN_AUTO_CLOSE',
    'RETURN_ACCEPT',
    'RETURN_GOODS_RECEIVED',
    'REFUND',
] as const

export const isReturnHistoryAction = (action: string | null | undefined): boolean =>
    (RETURN_HISTORY_ACTIONS as readonly string[]).includes(action ?? '')
