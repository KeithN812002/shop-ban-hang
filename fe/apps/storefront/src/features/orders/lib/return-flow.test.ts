import { describe, expect, it } from 'vitest'
import {
    canDisputeReturn,
    canSellerRespond,
    canWithdrawReturn,
    computeReturnSteps,
    isReturnHistoryAction,
} from './return-flow'

const states = (steps: ReturnType<typeof computeReturnSteps>) => steps.map(step => step.state)

describe('computeReturnSteps', () => {
    it('marks the seller answer as current while the request is waiting', () => {
        expect(states(computeReturnSteps('RETURN_REQUESTED', 'REQUESTED'))).toEqual([
            'done',
            'current',
            'todo',
            'todo',
            'todo',
        ])
    })

    it('blocks the seller step after a rejection or dispute', () => {
        expect(states(computeReturnSteps('RETURN_REQUESTED', 'REJECTED'))).toEqual([
            'done',
            'blocked',
            'todo',
            'todo',
            'todo',
        ])
        expect(states(computeReturnSteps('RETURN_REQUESTED', 'DISPUTED'))[1]).toBe('blocked')
    })

    it('advances with the order status and completes on REFUNDED', () => {
        expect(states(computeReturnSteps('RETURN_APPROVED', 'APPROVED'))).toEqual([
            'done',
            'done',
            'current',
            'todo',
            'todo',
        ])
        expect(states(computeReturnSteps('RETURN_SHIPPING', 'APPROVED'))).toEqual([
            'done',
            'done',
            'done',
            'current',
            'todo',
        ])
        expect(states(computeReturnSteps('RETURN_RECEIVED', 'APPROVED'))).toEqual([
            'done',
            'done',
            'done',
            'done',
            'current',
        ])
        expect(states(computeReturnSteps('REFUNDED', 'APPROVED'))).toEqual(['done', 'done', 'done', 'done', 'done'])
    })

    it('returns no steps outside the return flow', () => {
        expect(computeReturnSteps('COMPLETED', 'CANCELLED')).toEqual([])
        expect(computeReturnSteps('DELIVERED')).toEqual([])
    })
})

describe('buyer / seller permissions', () => {
    const now = new Date('2030-01-10T00:00:00').getTime()

    it('lets the buyer withdraw only while requested or rejected', () => {
        expect(canWithdrawReturn('RETURN_REQUESTED', { status: 'REQUESTED' })).toBe(true)
        expect(canWithdrawReturn('RETURN_REQUESTED', { status: 'REJECTED' })).toBe(true)
        expect(canWithdrawReturn('RETURN_REQUESTED', { status: 'DISPUTED' })).toBe(false)
        expect(canWithdrawReturn('RETURN_APPROVED', { status: 'APPROVED' })).toBe(false)
    })

    it('lets the buyer dispute a rejection before the deadline only', () => {
        const base = { status: 'REJECTED' as const }
        expect(canDisputeReturn('RETURN_REQUESTED', { ...base, disputeDeadline: '2030-01-12T00:00:00' }, now)).toBe(
            true,
        )
        expect(canDisputeReturn('RETURN_REQUESTED', { ...base, disputeDeadline: '2030-01-09T00:00:00' }, now)).toBe(
            false,
        )
        expect(canDisputeReturn('RETURN_REQUESTED', { ...base, disputeDeadline: null }, now)).toBe(true)
        expect(canDisputeReturn('RETURN_REQUESTED', { status: 'REQUESTED', disputeDeadline: null }, now)).toBe(false)
    })

    it('lets the seller answer a waiting request only', () => {
        expect(canSellerRespond('RETURN_REQUESTED', { status: 'REQUESTED' })).toBe(true)
        expect(canSellerRespond('RETURN_REQUESTED', { status: 'REJECTED' })).toBe(false)
        expect(canSellerRespond('RETURN_APPROVED', { status: 'APPROVED' })).toBe(false)
    })
})

describe('isReturnHistoryAction', () => {
    it('recognises return actions only', () => {
        expect(isReturnHistoryAction('REFUND')).toBe(true)
        expect(isReturnHistoryAction('CONFIRM')).toBe(false)
        expect(isReturnHistoryAction(null)).toBe(false)
    })
})
