import type { JobType, OrderStatus } from '@/types/shop'
import { isReturnJob } from './order-utils'

export interface DeliveryStep {
    key: string
    /** History status that marks the step as reached (its timestamp); null = no dedicated transition. */
    at: OrderStatus | null
}

export interface StepperModel {
    steps: DeliveryStep[]
    /** Steps already completed (the next one is the current step). */
    done: number
}

const ACCEPTED: DeliveryStep = { key: 'accepted', at: 'PICKING' }
const PICKED_UP: DeliveryStep = { key: 'pickedUp', at: 'SHIPPING' }
const SHIPPING: DeliveryStep = { key: 'shipping', at: null }

const FORWARD: DeliveryStep[] = [
    ACCEPTED,
    PICKED_UP,
    SHIPPING,
    { key: 'delivered', at: 'DELIVERED' },
    { key: 'completed', at: 'COMPLETED' },
]
const RETURN_LEG: DeliveryStep[] = [
    ACCEPTED,
    PICKED_UP,
    SHIPPING,
    { key: 'returning', at: 'RETURNING' },
    { key: 'returned', at: 'RETURNED' },
]
/** Return pickup job: the shipper only accepts and carries the parcel; the shop confirms receipt. */
const RETURN_JOB: DeliveryStep[] = [
    { key: 'returnAccepted', at: 'RETURN_SHIPPING' },
    { key: 'returnShipping', at: null },
    { key: 'returnReceived', at: 'RETURN_RECEIVED' },
]

const FORWARD_DONE: Partial<Record<OrderStatus, number>> = {
    PICKING: 1,
    SHIPPING: 2,
    DELIVERED: 4,
    COMPLETED: 5,
    RETURNING: 3,
    RETURNED: 5,
}
const RETURN_JOB_DONE: Partial<Record<OrderStatus, number>> = {
    RETURN_APPROVED: 0,
    RETURN_SHIPPING: 1,
    RETURN_RECEIVED: 3,
    REFUNDED: 3,
}

/** Stepper steps for an order, or null when no progress is shown (e.g. waiting in the available list). */
export const buildStepperModel = (status: OrderStatus, jobType?: JobType): StepperModel | null => {
    if (isReturnJob({ status, jobType })) {
        const done = RETURN_JOB_DONE[status]
        return done === undefined ? null : { steps: RETURN_JOB, done }
    }
    const done = FORWARD_DONE[status]
    if (done === undefined) return null
    return { steps: status === 'RETURNING' || status === 'RETURNED' ? RETURN_LEG : FORWARD, done }
}
