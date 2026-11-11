import type { Placement } from './anchors'

export const drawOverlay = (ctx: CanvasRenderingContext2D, image: CanvasImageSource, placement: Placement, alpha = 1): void => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(placement.cx, placement.cy)
    ctx.rotate(placement.rotation)
    ctx.drawImage(image, -placement.width / 2, -placement.height / 2, placement.width, placement.height)
    ctx.restore()
}

/**
 * Photo = current camera frame (mirrored like the preview when `mirror`) + the overlay canvas.
 * Rejects when the canvas is tainted (overlay served without CORS) or encoding fails.
 */
export const capturePhoto = (video: HTMLVideoElement, overlay: HTMLCanvasElement, mirror: boolean): Promise<Blob> =>
    new Promise((resolve, reject) => {
        const out = document.createElement('canvas')
        out.width = video.videoWidth
        out.height = video.videoHeight
        const ctx = out.getContext('2d')
        if (!ctx) {
            reject(new Error('Canvas 2D context unavailable'))
            return
        }
        ctx.save()
        if (mirror) {
            ctx.translate(out.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, out.width, out.height)
        ctx.restore()
        ctx.drawImage(overlay, 0, 0, out.width, out.height)
        try {
            out.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))), 'image/png')
        } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)))
        }
    })

export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
