import { describe, expect, it } from 'vitest'
import {
    applyAdjustments,
    computePlacement,
    FACE,
    GLASSES_WIDTH_PER_EYE_DISTANCE,
    HAT_WIDTH_PER_FACE_WIDTH,
    objectPlacement,
    POSE,
    requiredLandmarks,
    type Landmark,
} from './anchors'

const canvas = { width: 1000, height: 500 }

const sparse = (entries: Record<number, Landmark>): Array<Landmark | undefined> => {
    const out: Array<Landmark | undefined> = []
    for (const [index, lm] of Object.entries(entries)) out[Number(index)] = lm
    return out
}

describe('computePlacement - glasses', () => {
    const level = sparse({ [FACE.eyeRight]: { x: 0.4, y: 0.4 }, [FACE.eyeLeft]: { x: 0.6, y: 0.4 } })

    it('uses 2.1x the eye distance, centred between the eyes, no roll on a level face', () => {
        const p = computePlacement({ arType: 'FACE_GLASSES', landmarks: level, canvas, overlayAspect: 0.4, mirror: false })
        expect(p).not.toBeNull()
        expect(p?.width).toBeCloseTo(GLASSES_WIDTH_PER_EYE_DISTANCE * 200)
        expect(p?.height).toBeCloseTo((p?.width ?? 0) * 0.4)
        expect(p?.cx).toBeCloseTo(500)
        expect(p?.cy).toBeCloseTo(200)
        expect(p?.rotation).toBeCloseTo(0)
    })

    it('rolls with the eye line', () => {
        const tilted = sparse({ [FACE.eyeRight]: { x: 0.4, y: 0.4 }, [FACE.eyeLeft]: { x: 0.6, y: 0.5 } })
        const p = computePlacement({ arType: 'FACE_GLASSES', landmarks: tilted, canvas, overlayAspect: 0.4, mirror: false })
        expect(p?.rotation).toBeCloseTo(Math.atan2(50, 200))
    })

    it('mirroring flips x but keeps the roll sign consistent with what is displayed', () => {
        const tilted = sparse({ [FACE.eyeRight]: { x: 0.4, y: 0.4 }, [FACE.eyeLeft]: { x: 0.6, y: 0.5 } })
        const p = computePlacement({ arType: 'FACE_GLASSES', landmarks: tilted, canvas, overlayAspect: 0.4, mirror: true })
        expect(p?.cx).toBeCloseTo(500)
        // displayed left point is now the lower one -> the line rises to the right
        expect(p?.rotation).toBeCloseTo(-Math.atan2(50, 200))
    })

    it('returns null when a landmark is missing', () => {
        const partial = sparse({ [FACE.eyeRight]: { x: 0.4, y: 0.4 } })
        expect(computePlacement({ arType: 'FACE_GLASSES', landmarks: partial, canvas, overlayAspect: 0.4, mirror: false })).toBeNull()
    })
})

describe('computePlacement - hat / jewelry', () => {
    const face = sparse({
        [FACE.cheekRight]: { x: 0.4, y: 0.5 },
        [FACE.cheekLeft]: { x: 0.6, y: 0.5 },
        [FACE.forehead]: { x: 0.5, y: 0.3 },
        [FACE.chin]: { x: 0.5, y: 0.8 },
    })

    it('hat is 2.6x face width and sits above the forehead', () => {
        const p = computePlacement({ arType: 'FACE_HAT', landmarks: face, canvas, overlayAspect: 0.5, mirror: false })
        expect(p?.width).toBeCloseTo(HAT_WIDTH_PER_FACE_WIDTH * 200)
        // brim overlaps the forehead by at most ~15% of the hat height
        expect((p?.cy ?? 0) + (p?.height ?? 0) / 2).toBeLessThan(0.3 * 500 + 0.15 * (p?.height ?? 0))
        expect(p?.cy).toBeLessThan(0.3 * 500)
    })

    it('necklace hangs below the chin', () => {
        const p = computePlacement({ arType: 'FACE_JEWELRY', landmarks: face, canvas, overlayAspect: 0.5, mirror: false })
        expect((p?.cy ?? 0) - (p?.height ?? 0) / 2).toBeGreaterThan(0.8 * 500)
    })
})

describe('computePlacement - body', () => {
    const pose = sparse({
        [POSE.shoulderLeft]: { x: 0.6, y: 0.3, visibility: 0.9 },
        [POSE.shoulderRight]: { x: 0.4, y: 0.3, visibility: 0.9 },
        [POSE.hipLeft]: { x: 0.57, y: 0.6, visibility: 0.9 },
        [POSE.hipRight]: { x: 0.43, y: 0.6, visibility: 0.9 },
        [POSE.ankleLeft]: { x: 0.57, y: 0.95, visibility: 0.9 },
        [POSE.ankleRight]: { x: 0.43, y: 0.95, visibility: 0.9 },
    })

    it('top spans shoulders to hips, upright body = no rotation', () => {
        const p = computePlacement({ arType: 'BODY_TOP', landmarks: pose, canvas, overlayAspect: 1, mirror: false })
        expect(p?.rotation).toBeCloseTo(0)
        expect(p?.cx).toBeCloseTo(500)
        expect(p?.width).toBeGreaterThan(200)
        expect(p?.cy).toBeGreaterThan(0.3 * 500)
        expect(p?.cy).toBeLessThan(0.6 * 500)
    })

    it('bottom spans hips to ankles', () => {
        const p = computePlacement({ arType: 'BODY_BOTTOM', landmarks: pose, canvas, overlayAspect: 1, mirror: false })
        expect(p?.cy).toBeGreaterThan(0.6 * 500)
        expect(p?.rotation).toBeCloseTo(0)
    })

    it('rejects low-visibility landmarks', () => {
        const hidden = pose.slice()
        hidden[POSE.ankleLeft] = { x: 0.57, y: 0.95, visibility: 0.05 }
        expect(computePlacement({ arType: 'BODY_BOTTOM', landmarks: hidden, canvas, overlayAspect: 1, mirror: false })).toBeNull()
    })
})

describe('requiredLandmarks / OBJECT', () => {
    it('OBJECT needs no landmarks and computePlacement refuses it', () => {
        expect(requiredLandmarks('OBJECT')).toEqual([])
        expect(computePlacement({ arType: 'OBJECT', landmarks: [], canvas, overlayAspect: 1, mirror: false })).toBeNull()
    })

    it('objectPlacement is 45% of the canvas width', () => {
        const p = objectPlacement(canvas, { cx: 10, cy: 20, rotation: 0.5 }, 2)
        expect(p).toEqual({ cx: 10, cy: 20, width: 450, height: 900, rotation: 0.5 })
    })
})

describe('applyAdjustments', () => {
    const base = { cx: 100, cy: 100, width: 100, height: 50, rotation: 0 }

    it('scales around the centre', () => {
        expect(applyAdjustments(base, { scale: 2, offsetY: 0 })).toEqual({ cx: 100, cy: 100, width: 200, height: 100, rotation: 0 })
    })

    it('offsetY shifts down by a fraction of the (scaled) height', () => {
        const p = applyAdjustments(base, { scale: 1, offsetY: 0.5 })
        expect(p.cy).toBeCloseTo(125)
        expect(p.cx).toBeCloseTo(100)
    })

    it('offsetY follows the overlay rotation', () => {
        const p = applyAdjustments({ ...base, rotation: Math.PI / 2 }, { scale: 1, offsetY: 1 })
        expect(p.cx).toBeCloseTo(100 - 50)
        expect(p.cy).toBeCloseTo(100)
    })
})
