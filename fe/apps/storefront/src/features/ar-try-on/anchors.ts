// Pure anchor math for the AR try-on (contract section 7.2). No DOM, no MediaPipe imports: unit-testable.
import type { ArType } from '@/types/shop'

/** Normalised landmark (0..1 in video space), as produced by MediaPipe. */
export interface Landmark {
    x: number
    y: number
    /** Pose landmarks only: likelihood the point is visible */
    visibility?: number
}

export interface Size {
    width: number
    height: number
}

/** Where to draw the overlay, in canvas pixels. `rotation` is clockwise radians (canvas convention). */
export interface Placement {
    cx: number
    cy: number
    width: number
    height: number
    rotation: number
}

export interface Adjustments {
    /** multiplier on the overlay size (starts at the product's arScale) */
    scale: number
    /** vertical shift as a fraction of overlay height; positive = down (starts at arOffsetY) */
    offsetY: number
}

// MediaPipe FaceMesh landmark indices
export const FACE = { eyeRight: 33, eyeLeft: 263, forehead: 10, chin: 152, cheekRight: 234, cheekLeft: 454 } as const
// MediaPipe Pose landmark indices
export const POSE = {
    shoulderLeft: 11,
    shoulderRight: 12,
    hipLeft: 23,
    hipRight: 24,
    ankleLeft: 27,
    ankleRight: 28,
} as const

/** Contract multipliers. */
export const GLASSES_WIDTH_PER_EYE_DISTANCE = 2.1
export const HAT_WIDTH_PER_FACE_WIDTH = 2.6
/** Not fixed by the contract: necklace width relative to face width and its drop below the chin. */
export const JEWELRY_WIDTH_PER_FACE_WIDTH = 1.1
export const JEWELRY_DROP_PER_FACE_WIDTH = 0.35
/** Body garments are wider than the joint-to-joint distance (sleeves / trouser legs). */
export const TOP_WIDTH_PER_SHOULDER_WIDTH = 1.7
export const TOP_HEIGHT_PER_TORSO = 1.25
export const BOTTOM_WIDTH_PER_HIP_WIDTH = 1.9
export const BOTTOM_HEIGHT_PER_LEG = 1.12
const MIN_VISIBILITY = 0.3

export const isFaceType = (type: ArType): boolean =>
    type === 'FACE_GLASSES' || type === 'FACE_HAT' || type === 'FACE_JEWELRY'
export const isBodyType = (type: ArType): boolean => type === 'BODY_TOP' || type === 'BODY_BOTTOM'
export const isTrackedType = (type: ArType): boolean => isFaceType(type) || isBodyType(type)

/** Landmark indices the placement for `type` reads (used to smooth only what is needed). */
export const requiredLandmarks = (type: ArType): number[] => {
    switch (type) {
        case 'FACE_GLASSES':
            return [FACE.eyeRight, FACE.eyeLeft]
        case 'FACE_HAT':
            return [FACE.forehead, FACE.cheekRight, FACE.cheekLeft]
        case 'FACE_JEWELRY':
            return [FACE.chin, FACE.cheekRight, FACE.cheekLeft]
        case 'BODY_TOP':
            return [POSE.shoulderLeft, POSE.shoulderRight, POSE.hipLeft, POSE.hipRight]
        case 'BODY_BOTTOM':
            return [POSE.hipLeft, POSE.hipRight, POSE.ankleLeft, POSE.ankleRight]
        default:
            return []
    }
}

interface Point {
    x: number
    y: number
}

const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y)
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Maps an overlay-local offset (dx right, dy down, before rotation) to screen space around `origin`. */
export const offsetAlong = (origin: Point, rotation: number, dx: number, dy: number): Point => ({
    x: origin.x + dx * Math.cos(rotation) - dy * Math.sin(rotation),
    y: origin.y + dx * Math.sin(rotation) + dy * Math.cos(rotation),
})

/** Roll of the line a->b after ordering the points left-to-right on screen. */
const roll = (a: Point, b: Point): number => {
    const [left, right] = a.x <= b.x ? [a, b] : [b, a]
    return Math.atan2(right.y - left.y, right.x - left.x)
}

/** Rotation that turns the overlay's local "down" axis onto the vector from -> to. */
const rotationFromAxis = (from: Point, to: Point): number => Math.atan2(-(to.x - from.x), to.y - from.y)

interface PlacementInput {
    arType: ArType
    /** Sparse array is fine: only `requiredLandmarks(arType)` indices are read. */
    landmarks: ReadonlyArray<Landmark | undefined>
    canvas: Size
    /** overlay image height / width */
    overlayAspect: number
    /** true when the video is shown mirrored (front camera): x is flipped so overlays are not mirrored */
    mirror: boolean
}

/** Computes the unadjusted overlay placement, or null when the needed landmarks are missing / not visible. */
export const computePlacement = ({ arType, landmarks, canvas, overlayAspect, mirror }: PlacementInput): Placement | null => {
    const indices = requiredLandmarks(arType)
    if (indices.length === 0 || !Number.isFinite(overlayAspect) || overlayAspect <= 0) return null

    const pts: Record<number, Point> = {}
    for (const index of indices) {
        const lm = landmarks[index]
        if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return null
        if (isBodyType(arType) && (lm.visibility ?? 1) < MIN_VISIBILITY) return null
        pts[index] = { x: (mirror ? 1 - lm.x : lm.x) * canvas.width, y: lm.y * canvas.height }
    }
    const p = (index: number): Point => pts[index] as Point

    switch (arType) {
        case 'FACE_GLASSES': {
            const a = p(FACE.eyeRight)
            const b = p(FACE.eyeLeft)
            const width = GLASSES_WIDTH_PER_EYE_DISTANCE * distance(a, b)
            const height = width * overlayAspect
            return { ...asCenter(midpoint(a, b)), width, height, rotation: roll(a, b) }
        }
        case 'FACE_HAT': {
            const a = p(FACE.cheekRight)
            const b = p(FACE.cheekLeft)
            const width = HAT_WIDTH_PER_FACE_WIDTH * distance(a, b)
            const height = width * overlayAspect
            const rotation = roll(a, b)
            // Hat brim rests on the forehead: the centre sits above landmark 10.
            const c = offsetAlong(p(FACE.forehead), rotation, 0, -0.38 * height)
            return { cx: c.x, cy: c.y, width, height, rotation }
        }
        case 'FACE_JEWELRY': {
            const a = p(FACE.cheekRight)
            const b = p(FACE.cheekLeft)
            const faceWidth = distance(a, b)
            const width = JEWELRY_WIDTH_PER_FACE_WIDTH * faceWidth
            const height = width * overlayAspect
            const rotation = roll(a, b)
            const c = offsetAlong(p(FACE.chin), rotation, 0, JEWELRY_DROP_PER_FACE_WIDTH * faceWidth + height / 2)
            return { cx: c.x, cy: c.y, width, height, rotation }
        }
        case 'BODY_TOP': {
            const sl = p(POSE.shoulderLeft)
            const sr = p(POSE.shoulderRight)
            const shoulderMid = midpoint(sl, sr)
            const hipMid = midpoint(p(POSE.hipLeft), p(POSE.hipRight))
            const torso = distance(shoulderMid, hipMid)
            const width = TOP_WIDTH_PER_SHOULDER_WIDTH * distance(sl, sr)
            const height = TOP_HEIGHT_PER_TORSO * torso
            const rotation = rotationFromAxis(shoulderMid, hipMid)
            // Collar starts slightly above the shoulder line.
            const c = offsetAlong(shoulderMid, rotation, 0, -0.1 * torso + height / 2)
            return { cx: c.x, cy: c.y, width, height, rotation }
        }
        case 'BODY_BOTTOM': {
            const hl = p(POSE.hipLeft)
            const hr = p(POSE.hipRight)
            const hipMid = midpoint(hl, hr)
            const ankleMid = midpoint(p(POSE.ankleLeft), p(POSE.ankleRight))
            const leg = distance(hipMid, ankleMid)
            const width = BOTTOM_WIDTH_PER_HIP_WIDTH * distance(hl, hr)
            const height = BOTTOM_HEIGHT_PER_LEG * leg
            const rotation = rotationFromAxis(hipMid, ankleMid)
            const c = offsetAlong(hipMid, rotation, 0, -0.05 * leg + height / 2)
            return { cx: c.x, cy: c.y, width, height, rotation }
        }
        default:
            return null
    }
}

const asCenter = (point: Point): { cx: number; cy: number } => ({ cx: point.x, cy: point.y })

/** Applies the user's fine-tune (scale about the centre, vertical shift along the overlay's own axis). */
export const applyAdjustments = (placement: Placement, { scale, offsetY }: Adjustments): Placement => {
    const width = placement.width * scale
    const height = placement.height * scale
    const c = offsetAlong({ x: placement.cx, y: placement.cy }, placement.rotation, 0, offsetY * height)
    return { cx: c.x, cy: c.y, width, height, rotation: placement.rotation }
}

/** Base placement for OBJECT mode (and the manual fallback): centre + rotation chosen by the user. */
export const objectPlacement = (
    canvas: Size,
    state: { cx: number; cy: number; rotation: number },
    overlayAspect: number,
): Placement => {
    const width = canvas.width * 0.45
    return { cx: state.cx, cy: state.cy, width, height: width * overlayAspect, rotation: state.rotation }
}
