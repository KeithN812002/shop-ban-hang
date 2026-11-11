import type { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import { env } from '@/config/env'
import type { ArType } from '@/types/shop'
import { isFaceType, type Landmark } from './anchors'

// MediaPipe (JS bundle + wasm + model) is only fetched when a try-on page is opened.
type Vision = typeof import('@mediapipe/tasks-vision')

let visionPromise: Promise<{ vision: Vision; fileset: Awaited<ReturnType<Vision['FilesetResolver']['forVisionTasks']>> }> | null =
    null

const loadVision = () => {
    if (!visionPromise) {
        visionPromise = (async () => {
            const vision = await import('@mediapipe/tasks-vision')
            const fileset = await vision.FilesetResolver.forVisionTasks(env.arWasmUrl)
            return { vision, fileset }
        })().catch(error => {
            visionPromise = null // allow a retry after a network failure
            throw error
        })
    }
    return visionPromise
}

/** GPU first (fast), CPU when the delegate is unavailable. */
const withDelegateFallback = async <T>(create: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> => {
    try {
        return await create('GPU')
    } catch {
        return create('CPU')
    }
}

export const loadFaceLandmarker = async (): Promise<FaceLandmarker> => {
    const { vision, fileset } = await loadVision()
    return withDelegateFallback(delegate =>
        vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: env.arFaceModelUrl, delegate },
            runningMode: 'VIDEO',
            numFaces: 1,
        }),
    )
}

/** Uniform view over the face / pose models: normalised landmarks of the first subject, or null. */
export interface Tracker {
    detect: (video: HTMLVideoElement, timestampMs: number) => Landmark[] | null
    close: () => void
}

export const createTracker = async (arType: ArType): Promise<Tracker> => {
    if (isFaceType(arType)) {
        const model = await loadFaceLandmarker()
        return {
            detect: (video, ts) => model.detectForVideo(video, ts).faceLandmarks[0] ?? null,
            close: () => model.close(),
        }
    }
    const model = await loadPoseLandmarker()
    return {
        detect: (video, ts) => model.detectForVideo(video, ts).landmarks[0] ?? null,
        close: () => model.close(),
    }
}

export const loadPoseLandmarker = async (): Promise<PoseLandmarker> => {
    const { vision, fileset } = await loadVision()
    return withDelegateFallback(delegate =>
        vision.PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: env.arPoseModelUrl, delegate },
            runningMode: 'VIDEO',
            numPoses: 1,
        }),
    )
}
