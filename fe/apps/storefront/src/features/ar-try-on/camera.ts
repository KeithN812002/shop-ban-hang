export type CameraErrorKind = 'unsupported' | 'insecure' | 'denied' | 'notFound' | 'inUse' | 'unknown'
export type CameraFacing = 'user' | 'environment'

export class CameraError extends Error {
    readonly kind: CameraErrorKind

    constructor(kind: CameraErrorKind, cause?: unknown) {
        super(kind)
        this.name = 'CameraError'
        this.kind = kind
        this.cause = cause
    }
}

/** Maps a getUserMedia failure to something the UI can explain (by DOMException name). */
export const classifyCameraError = (error: unknown): CameraErrorKind => {
    if (error instanceof CameraError) return error.kind
    const name = (error as { name?: string } | null)?.name ?? ''
    switch (name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
        case 'SecurityError':
            return 'denied'
        case 'NotFoundError':
        case 'DevicesNotFoundError':
        case 'OverconstrainedError':
            return 'notFound'
        case 'NotReadableError':
        case 'TrackStartError':
        case 'AbortError':
            return 'inUse'
        default:
            return 'unknown'
    }
}

export const isCameraSupported = (): boolean =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'

export const openCamera = async (facing: CameraFacing): Promise<MediaStream> => {
    if (!isCameraSupported()) {
        // getUserMedia only exists in secure contexts (HTTPS / localhost).
        throw new CameraError(typeof window !== 'undefined' && !window.isSecureContext ? 'insecure' : 'unsupported')
    }
    try {
        return await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
    } catch (error) {
        throw new CameraError(classifyCameraError(error), error)
    }
}

export const stopStream = (stream: MediaStream | null | undefined): void => {
    stream?.getTracks().forEach(track => track.stop())
}

export const countVideoInputs = async (): Promise<number> => {
    if (!isCameraSupported() || typeof navigator.mediaDevices.enumerateDevices !== 'function') return 0
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        return devices.filter(device => device.kind === 'videoinput').length
    } catch {
        return 0
    }
}
