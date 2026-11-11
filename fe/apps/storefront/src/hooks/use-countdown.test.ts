import { describe, expect, it } from 'vitest'
import { formatCountdown } from './use-countdown'

describe('formatCountdown', () => {
    it('pads hours, minutes and seconds', () => {
        expect(formatCountdown(3_725_000)).toBe('01:02:05')
        expect(formatCountdown(0)).toBe('00:00:00')
    })

    it('does not cap hours at 24', () => {
        expect(formatCountdown(50 * 3_600_000)).toBe('50:00:00')
    })

    it('rounds partial seconds down', () => {
        expect(formatCountdown(1_999)).toBe('00:00:01')
    })
})
