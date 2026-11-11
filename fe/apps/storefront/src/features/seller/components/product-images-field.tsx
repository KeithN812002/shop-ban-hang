import { useRef } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SmartImage } from '@/components/ui/smart-image'
import { MAX_PRODUCT_IMAGES } from '../constants'
import type { ProductFormValues } from '../lib/product-schema'
import { useImageUpload } from '../lib/use-image-upload'

/** Product gallery: upload, reorder with arrows (first image = thumbnail) and remove. */
export function ProductImagesField({ error }: { error?: string }) {
    const { t } = useTranslation()
    const { control, setValue } = useFormContext<ProductFormValues>()
    const images = useWatch({ control, name: 'images' })
    const { upload, pending } = useImageUpload()
    const inputRef = useRef<HTMLInputElement>(null)

    const commit = (next: string[]) => setValue('images', next, { shouldDirty: true, shouldValidate: true })

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const room = MAX_PRODUCT_IMAGES - images.length
        const picked = Array.from(files).slice(0, Math.max(room, 0))
        const urls = await upload(picked)
        if (urls.length > 0) commit([...images, ...urls])
        if (inputRef.current) inputRef.current.value = ''
    }

    const move = (index: number, delta: -1 | 1) => {
        const target = index + delta
        if (target < 0 || target >= images.length) return
        const next = [...images]
        ;[next[index], next[target]] = [next[target], next[index]]
        commit(next)
    }

    const canAdd = images.length + pending < MAX_PRODUCT_IMAGES

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
                {images.map((url, index) => (
                    <div key={url} className="w-24 space-y-1">
                        <div className="relative size-24 overflow-hidden rounded-md border">
                            <SmartImage src={url} alt={t('seller.products.imageAlt', { index: index + 1 })} className="size-full object-cover" />
                            {index === 0 && (
                                <span className="absolute bottom-0 left-0 rounded-tr-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    {t('seller.products.thumbnail')}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => commit(images.filter(item => item !== url))}
                                aria-label={t('seller.common.remove')}
                                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                                aria-label={t('seller.products.moveLeft')}
                                className="rounded border p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                            >
                                <ArrowLeft className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                disabled={index === images.length - 1}
                                onClick={() => move(index, 1)}
                                aria-label={t('seller.products.moveRight')}
                                className="rounded border p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                            >
                                <ArrowRight className="size-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
                {Array.from({ length: pending }, (_, i) => (
                    <div key={`pending-${i}`} className="flex size-24 items-center justify-center rounded-md border bg-gray-50">
                        <Loader2 className="size-5 animate-spin text-brand-500" aria-label={t('seller.common.loading')} />
                    </div>
                ))}
                {canAdd && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-500 hover:text-brand-600"
                    >
                        <ImagePlus className="size-5" aria-hidden />
                        {t('seller.products.addImage')}
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={event => void handleFiles(event.target.files)}
            />
            <p className="text-xs text-gray-500">
                {t('seller.products.imagesHint', { count: images.length, max: MAX_PRODUCT_IMAGES })}
            </p>
            {error && (
                <p role="alert" className="text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}
