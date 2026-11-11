// Landmark smoothing (pure). Adaptive exponential filter: slow jitter is damped hard, fast motion passes through.
import type { Landmark } from './anchors'

export interface SmootherOptions {
    /** blend factor when the point is (almost) still: lower = smoother */
    minAlpha?: number
    /** blend factor when the point moves fast */
    maxAlpha?: number
    /** normalised distance per frame at which alpha reaches maxAlpha */
    speedForMax?: number
}

const DEFAULTS: Required<SmootherOptions> = { minAlpha: 0.25, maxAlpha: 0.85, speedForMax: 0.04 }

/** One filtered sample. `prev` null = first sample (returned as is). */
export const smoothLandmark = (prev: Landmark | null, next: Landmark, options: SmootherOptions = {}): Landmark => {
    if (!prev) return { ...next }
    const { minAlpha, maxAlpha, speedForMax } = { ...DEFAULTS, ...options }
    const speed = Math.hypot(next.x - prev.x, next.y - prev.y)
    const t = Math.min(1, speed / speedForMax)
    const alpha = minAlpha + (maxAlpha - minAlpha) * t
    return {
        x: prev.x + (next.x - prev.x) * alpha,
        y: prev.y + (next.y - prev.y) * alpha,
        visibility: next.visibility,
    }
}

/** Stateful wrapper over `smoothLandmark`, keyed by landmark index. */
export class LandmarkSmoother {
    private readonly state = new Map<number, Landmark>()

    constructor(private readonly options: SmootherOptions = {}) {}

    push(index: number, sample: Landmark): Landmark {
        const filtered = smoothLandmark(this.state.get(index) ?? null, sample, this.options)
        this.state.set(index, filtered)
        return filtered
    }

    /** Forget history (tracking lost, switched camera): the next sample is taken as is. */
    reset(): void {
        this.state.clear()
    }
}

/** Smooths only the needed indices of a full landmark list into a sparse array. */
export const smoothSelected = (
    smoother: LandmarkSmoother,
    landmarks: ReadonlyArray<Landmark>,
    indices: number[],
): Array<Landmark | undefined> => {
    const out: Array<Landmark | undefined> = []
    for (const index of indices) {
        const lm = landmarks[index]
        if (lm) out[index] = smoother.push(index, { x: lm.x, y: lm.y, visibility: lm.visibility })
    }
    return out
}
