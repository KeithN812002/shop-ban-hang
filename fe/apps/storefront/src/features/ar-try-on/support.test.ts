import { describe, expect, it } from 'vitest'
import { classifyCameraError } from './camera'
import { pinchDelta, wheelScaleFactor } from './gestures'
import { LandmarkSmoother, smoothLandmark } from './smoothing'

describe('smoothing', () => {
    it('returns the first sample unchanged', () => {
        expect(smoothLandmark(null, { x: 0.5, y: 0.5 })).toEqual({ x: 0.5, y: 0.5 })
    })

    it('damps small jitter strongly', () => {
        const out = smoothLandmark({ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 })
        expect(out.x).toBeGreaterThan(0.5)
        expect(out.x).toBeLessThan(0.5005)
    })

    it('follows fast motion closely', () => {
        const out = smoothLandmark({ x: 0.2, y: 0.5 }, { x: 0.6, y: 0.5 })
        expect(out.x).toBeGreaterThan(0.5)
    })

    it('reset makes the next sample pass through', () => {
        const smoother = new LandmarkSmoother()
        smoother.push(1, { x: 0, y: 0 })
        smoother.reset()
        expect(smoother.push(1, { x: 1, y: 1 })).toEqual({ x: 1, y: 1, visibility: undefined })
    })
})

describe('pinchDelta', () => {
    it('detects scale, rotation and translation', () => {
        const d = pinchDelta(
            [{ x: 0, y: 0 }, { x: 100, y: 0 }],
            [{ x: 10, y: 10 }, { x: 10, y: 210 }],
        )
        expect(d.scale).toBeCloseTo(2)
        expect(d.rotation).toBeCloseTo(Math.PI / 2)
        expect(d.dx).toBeCloseTo(-40)
        expect(d.dy).toBeCloseTo(110)
    })

    it('does not divide by zero', () => {
        expect(pinchDelta([{ x: 1, y: 1 }, { x: 1, y: 1 }], [{ x: 0, y: 0 }, { x: 5, y: 5 }]).scale).toBe(1)
    })
})

describe('wheelScaleFactor', () => {
    it('shrinks on positive deltaY and grows on negative', () => {
        expect(wheelScaleFactor(100)).toBeLessThan(1)
        expect(wheelScaleFactor(-100)).toBeGreaterThan(1)
    })
})

describe('classifyCameraError', () => {
    it.each([
        ['NotAllowedError', 'denied'],
        ['NotFoundError', 'notFound'],
        ['NotReadableError', 'inUse'],
        ['SomethingElse', 'unknown'],
    ])('%s -> %s', (name, kind) => {
        expect(classifyCameraError({ name })).toBe(kind)
    })

    it('handles non-objects', () => {
        expect(classifyCameraError(null)).toBe('unknown')
    })
})
