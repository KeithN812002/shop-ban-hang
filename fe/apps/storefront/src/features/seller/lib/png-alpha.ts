const SAMPLE_SIZE = 256

const loadImage = (file: Blob): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file)
        const image = new Image()
        image.onload = () => {
            URL.revokeObjectURL(url)
            resolve(image)
        }
        image.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Cannot decode image'))
        }
        image.src = url
    })

/**
 * True when at least one pixel of the image is not fully opaque. The image is scaled down first so
 * the check stays cheap on large overlays; a tiny transparent edge still survives the downscale.
 */
export const hasTransparency = async (file: Blob): Promise<boolean> => {
    const image = await loadImage(file)
    const scale = Math.min(1, SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight, 1))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D context unavailable')
    context.drawImage(image, 0, 0, width, height)

    const { data } = context.getImageData(0, 0, width, height)
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true
    }
    return false
}
