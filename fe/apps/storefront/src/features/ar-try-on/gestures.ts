// Pointer-gesture math for OBJECT mode (pure).
export interface Pt {
    x: number
    y: number
}

export type PointerPair = readonly [Pt, Pt]

export interface PinchDelta {
    /** multiplicative change in size */
    scale: number
    /** change in rotation, clockwise radians (-PI..PI) */
    rotation: number
    /** movement of the pinch midpoint */
    dx: number
    dy: number
}

const wrapAngle = (angle: number): number => {
    let a = angle
    while (a > Math.PI) a -= 2 * Math.PI
    while (a < -Math.PI) a += 2 * Math.PI
    return a
}

/** Change between two successive two-finger positions. */
export const pinchDelta = (prev: PointerPair, next: PointerPair): PinchDelta => {
    const prevDist = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y)
    const nextDist = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y)
    const prevAngle = Math.atan2(prev[1].y - prev[0].y, prev[1].x - prev[0].x)
    const nextAngle = Math.atan2(next[1].y - next[0].y, next[1].x - next[0].x)
    return {
        scale: prevDist > 0 ? nextDist / prevDist : 1,
        rotation: wrapAngle(nextAngle - prevAngle),
        dx: (next[0].x + next[1].x) / 2 - (prev[0].x + prev[1].x) / 2,
        dy: (next[0].y + next[1].y) / 2 - (prev[0].y + prev[1].y) / 2,
    }
}

/** Wheel notch -> scale factor (deltaY > 0 shrinks). */
export const wheelScaleFactor = (deltaY: number): number => Math.exp(-deltaY * 0.0015)

export const clampValue = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
