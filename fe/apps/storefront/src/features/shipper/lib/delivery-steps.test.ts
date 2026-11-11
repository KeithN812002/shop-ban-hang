import { describe, expect, it } from 'vitest'
import { buildStepperModel } from './delivery-steps'
import { codAmountOf, isReturnJob } from './order-utils'

const keys = (model: ReturnType<typeof buildStepperModel>) => model?.steps.map(step => step.key)

describe('buildStepperModel', () => {
    it('keeps the delivery and hand-back legs unchanged', () => {
        expect(keys(buildStepperModel('SHIPPING', 'DELIVERY'))).toEqual([
            'accepted',
            'pickedUp',
            'shipping',
            'delivered',
            'completed',
        ])
        expect(buildStepperModel('PICKING')?.done).toBe(1)
        expect(keys(buildStepperModel('RETURNING'))).toEqual([
            'accepted',
            'pickedUp',
            'shipping',
            'returning',
            'returned',
        ])
    })

    it('uses the three-step return pickup model for RETURN jobs', () => {
        expect(keys(buildStepperModel('RETURN_SHIPPING', 'RETURN'))).toEqual([
            'returnAccepted',
            'returnShipping',
            'returnReceived',
        ])
        expect(buildStepperModel('RETURN_APPROVED', 'RETURN')?.done).toBe(0)
        expect(buildStepperModel('RETURN_SHIPPING', 'RETURN')?.done).toBe(1)
        expect(buildStepperModel('RETURN_RECEIVED', 'RETURN')?.done).toBe(3)
    })

    it('falls back to the return model for return-only statuses without a jobType', () => {
        expect(buildStepperModel('RETURN_SHIPPING')?.steps).toHaveLength(3)
    })

    it('shows nothing for a delivery order that moved into the buyer return flow', () => {
        expect(buildStepperModel('RETURN_REQUESTED', 'DELIVERY')).toBeNull()
        expect(buildStepperModel('REFUNDED', 'DELIVERY')).toBeNull()
    })
})

describe('return jobs', () => {
    it('detects return jobs', () => {
        expect(isReturnJob({ jobType: 'RETURN', status: 'RETURN_APPROVED' })).toBe(true)
        expect(isReturnJob({ jobType: 'DELIVERY', status: 'READY_TO_SHIP' })).toBe(false)
    })

    it('never asks to collect cash on a return job', () => {
        expect(
            codAmountOf({
                total: 100_000,
                paymentStatus: 'UNPAID',
                codAmount: 100_000,
                jobType: 'RETURN',
                status: 'RETURN_SHIPPING',
            }),
        ).toBe(0)
        expect(codAmountOf({ total: 100_000, paymentStatus: 'UNPAID', jobType: 'DELIVERY', status: 'SHIPPING' })).toBe(
            100_000,
        )
        expect(codAmountOf({ total: 100_000, paymentStatus: 'PAID' })).toBe(0)
    })
})
