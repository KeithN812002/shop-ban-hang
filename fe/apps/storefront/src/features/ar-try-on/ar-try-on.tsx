import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Camera, CameraOff, Loader2, RefreshCw, RotateCcw, SwitchCamera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@/components/ui/button'
import { resolveMediaUrl } from '@/lib/media'
import { notify } from '@/lib/notify'
import type { ProductDetail } from '@/types/shop'
import {
    applyAdjustments,
    computePlacement,
    isFaceType,
    isTrackedType,
    objectPlacement,
    requiredLandmarks,
    type Adjustments,
    type Placement,
} from './anchors'
import {
    classifyCameraError,
    countVideoInputs,
    openCamera,
    stopStream,
    type CameraErrorKind,
    type CameraFacing,
} from './camera'
import { clampValue, pinchDelta, wheelScaleFactor, type Pt } from './gestures'
import { createTracker, type Tracker } from './landmarkers'
import { capturePhoto, downloadBlob, drawOverlay } from './renderer'
import { LandmarkSmoother, smoothSelected } from './smoothing'

type ArProduct = Pick<ProductDetail, 'id' | 'slug' | 'name' | 'arType' | 'arOverlayUrl' | 'arScale' | 'arOffsetY'>

type CameraState = { status: 'starting' } | { status: 'running' } | { status: 'error'; kind: CameraErrorKind }
type LoadState = 'idle' | 'loading' | 'ready' | 'failed'

interface ObjectState {
    cx: number
    cy: number
    rotation: number
}

/** Frames without a subject before the overlay is hidden (keeps it steady through short detection gaps). */
const LOST_FRAMES_BEFORE_HIDE = 12
const MAX_DETECT_FAILURES = 30
const KEY_STEP_PX = 12

export function ArTryOn({ product }: { product: ArProduct }) {
    const { t } = useTranslation()
    const tRef = useRef(t)
    tRef.current = t

    const arType = product.arType
    const tracked = isTrackedType(arType)
    const initial: Adjustments = { scale: product.arScale ?? 1, offsetY: product.arOffsetY ?? 0 }

    const [facing, setFacing] = useState<CameraFacing>('user')
    const [camera, setCamera] = useState<CameraState>({ status: 'starting' })
    const [attempt, setAttempt] = useState(0)
    const [trackerState, setTrackerState] = useState<LoadState>(tracked ? 'loading' : 'idle')
    const [overlayState, setOverlayState] = useState<LoadState>(product.arOverlayUrl ? 'loading' : 'failed')
    const [adjust, setAdjust] = useState<Adjustments>(initial)
    const [aspect, setAspect] = useState(4 / 3)
    const [subjectLost, setSubjectLost] = useState(false)
    const [canSwitch, setCanSwitch] = useState(false)
    const [capturing, setCapturing] = useState(false)

    const mirror = facing === 'user'
    // Drag / pinch / wheel mode: OBJECT products, or tracked ones whose model failed to load.
    const manual = !tracked || trackerState === 'failed'

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)
    const trackerRef = useRef<Tracker | null>(null)
    const adjustRef = useRef<Adjustments>(initial)
    const objectRef = useRef<ObjectState | null>(null)
    const lastPlacementRef = useRef<Placement | null>(null)
    const smootherRef = useRef(new LandmarkSmoother())
    const pointersRef = useRef(new Map<number, Pt>())

    const updateAdjust = useCallback((next: Adjustments) => {
        adjustRef.current = next
        setAdjust(next)
    }, [])

    const scaleMin = Math.min(0.2, initial.scale)
    const scaleMax = Math.max(3, initial.scale)

    // ---- camera lifecycle: tracks are always stopped on cleanup / unmount ----
    useEffect(() => {
        let cancelled = false
        let stream: MediaStream | null = null
        setCamera({ status: 'starting' })
        lastPlacementRef.current = null
        smootherRef.current.reset()

        const start = async () => {
            try {
                stream = await openCamera(facing)
                const video = videoRef.current
                if (cancelled || !video) {
                    stopStream(stream)
                    return
                }
                video.srcObject = stream
                await video.play()
                if (cancelled) return
                if (video.videoWidth > 0 && video.videoHeight > 0) setAspect(video.videoWidth / video.videoHeight)
                setCamera({ status: 'running' })
                const inputs = await countVideoInputs()
                if (!cancelled) setCanSwitch(inputs > 1)
            } catch (error) {
                if (cancelled) return
                stopStream(stream)
                const kind = classifyCameraError(error)
                if (facing === 'environment' && kind === 'notFound') {
                    notify.error(tRef.current('ar.errors.switchFailed'))
                    setFacing('user')
                    return
                }
                setCamera({ status: 'error', kind })
            }
        }
        void start()

        return () => {
            cancelled = true
            stopStream(stream)
            const video = videoRef.current
            if (video) video.srcObject = null
        }
    }, [facing, attempt])

    // ---- tracker (face / pose) loaded lazily ----
    useEffect(() => {
        if (!tracked) return
        let cancelled = false
        let created: Tracker | null = null
        setTrackerState('loading')
        createTracker(arType)
            .then(tracker => {
                if (cancelled) {
                    tracker.close()
                    return
                }
                created = tracker
                trackerRef.current = tracker
                setTrackerState('ready')
            })
            .catch((error: unknown) => {
                console.error('AR tracker failed to load', error)
                if (!cancelled) setTrackerState('failed')
            })
        return () => {
            cancelled = true
            trackerRef.current = null
            created?.close()
        }
    }, [arType, tracked])

    // ---- overlay image (crossOrigin so the capture canvas is not tainted) ----
    useEffect(() => {
        const url = resolveMediaUrl(product.arOverlayUrl)
        imageRef.current = null
        if (!url) {
            setOverlayState('failed')
            return
        }
        setOverlayState('loading')
        const image = new Image()
        image.crossOrigin = 'anonymous'
        let cancelled = false
        image.onload = () => {
            if (cancelled) return
            imageRef.current = image
            setOverlayState('ready')
        }
        image.onerror = () => {
            if (!cancelled) setOverlayState('failed')
        }
        image.src = url
        return () => {
            cancelled = true
            image.onload = null
            image.onerror = null
        }
    }, [product.arOverlayUrl])

    // ---- render loop ----
    useEffect(() => {
        if (camera.status !== 'running') return
        let raf = 0
        let lastVideoTime = -1
        let lostFrames = 0
        let failures = 0
        let lostFlag = false
        const indices = requiredLandmarks(arType)

        const setLost = (value: boolean) => {
            if (lostFlag !== value) {
                lostFlag = value
                setSubjectLost(value)
            }
        }

        const frame = () => {
            raf = requestAnimationFrame(frame)
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const image = imageRef.current
            if (!image || image.naturalWidth === 0) return
            const overlayAspect = image.naturalHeight / image.naturalWidth
            const size = { width: canvas.width, height: canvas.height }

            let base: Placement | null = null
            if (manual) {
                objectRef.current ??= { cx: size.width / 2, cy: size.height / 2, rotation: 0 }
                base = objectPlacement(size, objectRef.current, overlayAspect)
            } else {
                const tracker = trackerRef.current
                if (tracker && video.currentTime !== lastVideoTime) {
                    lastVideoTime = video.currentTime
                    try {
                        const landmarks = tracker.detect(video, performance.now())
                        failures = 0
                        const placement = landmarks
                            ? computePlacement({
                                  arType,
                                  landmarks: smoothSelected(smootherRef.current, landmarks, indices),
                                  canvas: size,
                                  overlayAspect,
                                  mirror,
                              })
                            : null
                        if (placement) {
                            lastPlacementRef.current = placement
                            lostFrames = 0
                            setLost(false)
                        } else {
                            lostFrames += 1
                            if (lostFrames > LOST_FRAMES_BEFORE_HIDE) {
                                lastPlacementRef.current = null
                                smootherRef.current.reset()
                                setLost(true)
                            }
                        }
                    } catch (error) {
                        failures += 1
                        if (failures > MAX_DETECT_FAILURES) {
                            console.error('AR detection keeps failing', error)
                            setTrackerState('failed')
                        }
                    }
                }
                base = lastPlacementRef.current
            }

            if (base) drawOverlay(ctx, image, applyAdjustments(base, adjustRef.current))
        }

        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [camera.status, arType, manual, mirror])

    // ---- manual mode: wheel = scale, shift + wheel = rotate ----
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !manual) return
        const onWheel = (event: globalThis.WheelEvent) => {
            event.preventDefault()
            if (event.shiftKey) {
                const object = objectRef.current
                if (object) object.rotation += event.deltaY * 0.002
            } else {
                updateAdjust({
                    ...adjustRef.current,
                    scale: clampValue(adjustRef.current.scale * wheelScaleFactor(event.deltaY), scaleMin, scaleMax),
                })
            }
        }
        canvas.addEventListener('wheel', onWheel, { passive: false })
        return () => canvas.removeEventListener('wheel', onWheel)
    }, [manual, scaleMin, scaleMax, updateAdjust])

    const toCanvasPoint = (event: PointerEvent<HTMLCanvasElement>): Pt => {
        const canvas = event.currentTarget
        const rect = canvas.getBoundingClientRect()
        return {
            x: ((event.clientX - rect.left) * canvas.width) / rect.width,
            y: ((event.clientY - rect.top) * canvas.height) / rect.height,
        }
    }

    const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
        if (!manual) return
        event.currentTarget.setPointerCapture(event.pointerId)
        pointersRef.current.set(event.pointerId, toCanvasPoint(event))
    }

    const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
        const pointers = pointersRef.current
        const previous = pointers.get(event.pointerId)
        const object = objectRef.current
        if (!manual || !previous || !object) return

        const before = Array.from(pointers.values())
        const point = toCanvasPoint(event)
        pointers.set(event.pointerId, point)

        if (pointers.size === 1) {
            object.cx += point.x - previous.x
            object.cy += point.y - previous.y
        } else if (pointers.size >= 2) {
            const after = Array.from(pointers.values())
            const delta = pinchDelta([before[0] as Pt, before[1] as Pt], [after[0] as Pt, after[1] as Pt])
            object.cx += delta.dx
            object.cy += delta.dy
            object.rotation += delta.rotation
            updateAdjust({
                ...adjustRef.current,
                scale: clampValue(adjustRef.current.scale * delta.scale, scaleMin, scaleMax),
            })
        }
    }

    const onPointerEnd = (event: PointerEvent<HTMLCanvasElement>) => {
        pointersRef.current.delete(event.pointerId)
    }

    const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
        const object = objectRef.current
        if (!manual || !object) return
        const moves: Record<string, [number, number]> = {
            ArrowLeft: [-KEY_STEP_PX, 0],
            ArrowRight: [KEY_STEP_PX, 0],
            ArrowUp: [0, -KEY_STEP_PX],
            ArrowDown: [0, KEY_STEP_PX],
        }
        const move = moves[event.key]
        if (move) {
            object.cx += move[0]
            object.cy += move[1]
        } else if (event.key === '+' || event.key === '=') {
            updateAdjust({ ...adjustRef.current, scale: clampValue(adjustRef.current.scale * 1.05, scaleMin, scaleMax) })
        } else if (event.key === '-') {
            updateAdjust({ ...adjustRef.current, scale: clampValue(adjustRef.current.scale / 1.05, scaleMin, scaleMax) })
        } else if (event.key === '[') {
            object.rotation -= 0.05
        } else if (event.key === ']') {
            object.rotation += 0.05
        } else {
            return
        }
        event.preventDefault()
    }

    const reset = () => {
        updateAdjust(initial)
        objectRef.current = null
    }

    const capture = async () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || camera.status !== 'running') return
        setCapturing(true)
        try {
            const blob = await capturePhoto(video, canvas, mirror)
            downloadBlob(blob, `try-on-${product.slug || product.id}-${Date.now()}.png`)
            notify.success(t('ar.captured'))
        } catch (error) {
            console.error('AR capture failed', error)
            notify.error(t('ar.errors.captureFailed'))
        } finally {
            setCapturing(false)
        }
    }

    const running = camera.status === 'running'
    const hint = manual
        ? t('ar.hintManual')
        : subjectLost
          ? t(isFaceType(arType) ? 'ar.hintFace' : 'ar.hintBody')
          : null

    return (
        <div className="space-y-4">
            <div
                className="relative mx-auto overflow-hidden rounded-xl bg-black"
                style={{ aspectRatio: String(aspect), width: `min(100%, calc(70vh * ${aspect}))` }}
            >
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    aria-label={t('ar.cameraPreview')}
                    className="absolute inset-0 size-full"
                    style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
                />
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={t('ar.overlayCanvas', { name: product.name })}
                    tabIndex={manual && running ? 0 : -1}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    onKeyDown={onKeyDown}
                    className={cn('absolute inset-0 size-full', manual && running && 'cursor-grab touch-none active:cursor-grabbing')}
                />

                {camera.status === 'starting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                        <Loader2 className="size-8 animate-spin" aria-hidden />
                        <p className="text-sm">{t('ar.startingCamera')}</p>
                    </div>
                )}

                {camera.status === 'error' && (
                    <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/95 p-6 text-center text-white">
                        <CameraOff className="size-10 text-red-400" aria-hidden />
                        <p className="font-semibold">{t(`ar.errors.${camera.kind}.title`)}</p>
                        <p className="max-w-sm text-sm text-gray-300">{t(`ar.errors.${camera.kind}.description`)}</p>
                        {camera.kind !== 'unsupported' && camera.kind !== 'insecure' && (
                            <Button variant="soft" icon={<RefreshCw />} onClick={() => setAttempt(n => n + 1)}>
                                {t('common.retry')}
                            </Button>
                        )}
                    </div>
                )}

                {running && (trackerState === 'loading' || overlayState === 'loading') && (
                    <p className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                        <Loader2 className="size-3 animate-spin" aria-hidden />
                        {overlayState === 'loading' ? t('ar.loadingOverlay') : t('ar.loadingModel')}
                    </p>
                )}
                {running && hint && (
                    <p className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-3 py-1.5 text-center text-xs text-white" role="status">
                        {hint}
                    </p>
                )}
            </div>

            {overlayState === 'failed' && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {t('ar.overlayFailed')}
                </p>
            )}
            {trackerState === 'failed' && (
                <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {t('ar.trackerFailed')}
                </p>
            )}

            <div className="mx-auto grid max-w-3xl gap-4 rounded-xl bg-white p-4 sm:grid-cols-2">
                <label className="block space-y-1">
                    <span className="flex justify-between text-sm font-medium text-gray-700">
                        {t('ar.scale')}
                        <span className="text-gray-500">x{adjust.scale.toFixed(2)}</span>
                    </span>
                    <input
                        type="range"
                        min={scaleMin}
                        max={scaleMax}
                        step={0.01}
                        value={adjust.scale}
                        onChange={event => updateAdjust({ ...adjustRef.current, scale: Number(event.target.value) })}
                        className="w-full accent-brand-500"
                    />
                </label>
                <label className="block space-y-1">
                    <span className="flex justify-between text-sm font-medium text-gray-700">
                        {t('ar.offsetY')}
                        <span className="text-gray-500">{adjust.offsetY.toFixed(2)}</span>
                    </span>
                    <input
                        type="range"
                        min={Math.min(-0.5, initial.offsetY)}
                        max={Math.max(0.5, initial.offsetY)}
                        step={0.01}
                        value={adjust.offsetY}
                        onChange={event => updateAdjust({ ...adjustRef.current, offsetY: Number(event.target.value) })}
                        className="w-full accent-brand-500"
                    />
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                    <Button size="lg" icon={<Camera />} loading={capturing} disabled={!running} onClick={() => void capture()}>
                        {t('ar.capture')}
                    </Button>
                    {canSwitch && (
                        <Button
                            variant="outline"
                            size="lg"
                            icon={<SwitchCamera />}
                            disabled={camera.status === 'starting'}
                            onClick={() => setFacing(current => (current === 'user' ? 'environment' : 'user'))}
                        >
                            {t('ar.switchCamera')}
                        </Button>
                    )}
                    <Button variant="ghost" size="lg" icon={<RotateCcw />} onClick={reset}>
                        {t('ar.reset')}
                    </Button>
                </div>
            </div>
        </div>
    )
}
