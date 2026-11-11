import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, buttonClass } from '@/components/ui/button'
import { Select } from '@/components/ui/form-controls'
import { SmartImage } from '@/components/ui/smart-image'
import { resolveMediaUrl } from '@/lib/media'
import type { Uuid } from '@/types/api'
import { AR_TYPES } from '../constants'
import { hasTransparency } from '../lib/png-alpha'
import { AR_OFFSET_RANGE, AR_SCALE_RANGE, type ProductFormValues } from '../lib/product-schema'
import { useImageUpload } from '../lib/use-image-upload'

type AlphaState = 'unknown' | 'transparent' | 'opaque'

const CHECKERBOARD: CSSProperties = {
    backgroundImage: 'repeating-conic-gradient(#d4d4d4 0% 25%, #ffffff 0% 50%)',
    backgroundSize: '16px 16px',
}

/** Loads the stored overlay through the same-origin media proxy and reports whether it has an alpha channel. */
function useOverlayAlpha(url: string | null): AlphaState {
    const [state, setState] = useState<{ url: string | null; alpha: AlphaState }>({ url: null, alpha: 'unknown' })

    useEffect(() => {
        if (!url) return undefined
        const controller = new AbortController()
        void (async () => {
            try {
                const response = await fetch(resolveMediaUrl(url), { signal: controller.signal })
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const transparent = await hasTransparency(await response.blob())
                setState({ url, alpha: transparent ? 'transparent' : 'opaque' })
            } catch {
                // Aborted, offline or undecodable: the warning is advisory, so stay silent.
                if (!controller.signal.aborted) setState({ url, alpha: 'unknown' })
            }
        })()
        return () => controller.abort()
    }, [url])

    return state.url === url && url ? state.alpha : 'unknown'
}

export function ArSection({ productId }: { productId?: Uuid }) {
    const { t } = useTranslation()
    const {
        register,
        control,
        setValue,
        formState: { errors },
    } = useFormContext<ProductFormValues>()
    const arType = useWatch({ control, name: 'arType' })
    const overlayUrl = useWatch({ control, name: 'arOverlayUrl' })
    const arScale = useWatch({ control, name: 'arScale' })
    const arOffsetY = useWatch({ control, name: 'arOffsetY' })
    const { upload, isUploading } = useImageUpload()
    const inputRef = useRef<HTMLInputElement>(null)
    const alpha = useOverlayAlpha(overlayUrl)

    const handleFile = async (files: FileList | null) => {
        const file = files?.[0]
        if (!file) return
        const [url] = await upload([file], { accept: ['image/png'] })
        if (url) setValue('arOverlayUrl', url, { shouldDirty: true, shouldValidate: true })
        if (inputRef.current) inputRef.current.value = ''
    }

    const sliderClass = 'w-full accent-brand-500'

    return (
        <div className="space-y-4">
            <label className="block space-y-1">
                <span className="text-sm font-medium text-gray-700">{t('seller.products.ar.type')}</span>
                <Select {...register('arType')}>
                    {AR_TYPES.map(type => (
                        <option key={type} value={type}>
                            {t(`seller.products.ar.types.${type}`)}
                        </option>
                    ))}
                </Select>
                <span className="block text-xs text-gray-500">{t(`seller.products.ar.hint.${arType}`)}</span>
            </label>

            {arType !== 'NONE' && (
                <>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{t('seller.products.ar.overlay')}</p>
                        <div className="flex flex-wrap items-start gap-4">
                            <div
                                className="flex size-40 items-center justify-center overflow-hidden rounded-lg border"
                                style={CHECKERBOARD}
                            >
                                {isUploading ? (
                                    <Loader2 className="size-6 animate-spin text-brand-500" aria-label={t('seller.common.loading')} />
                                ) : overlayUrl ? (
                                    <SmartImage
                                        src={overlayUrl}
                                        alt={t('seller.products.ar.overlayAlt')}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <span className="px-3 text-center text-xs text-gray-500">
                                        {t('seller.products.ar.noOverlay')}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<ImagePlus />}
                                    loading={isUploading}
                                    onClick={() => inputRef.current?.click()}
                                >
                                    {overlayUrl ? t('seller.products.ar.replace') : t('seller.products.ar.upload')}
                                </Button>
                                {overlayUrl && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Trash2 className="text-red-600" />}
                                        onClick={() => setValue('arOverlayUrl', null, { shouldDirty: true, shouldValidate: true })}
                                    >
                                        {t('seller.common.remove')}
                                    </Button>
                                )}
                                <p className="max-w-64 text-xs text-gray-500">{t('seller.products.ar.overlayHint')}</p>
                            </div>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png"
                            hidden
                            onChange={event => void handleFile(event.target.files)}
                        />
                        {alpha === 'opaque' && (
                            <p role="alert" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                                {t('seller.products.ar.noAlphaWarning')}
                            </p>
                        )}
                        {errors.arOverlayUrl?.message && (
                            <p role="alert" className="text-xs text-red-600">
                                {errors.arOverlayUrl.message}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-1">
                            <span className="flex justify-between text-sm font-medium text-gray-700">
                                {t('seller.products.ar.scale')}
                                <span className="font-mono text-gray-500">{Number(arScale).toFixed(2)}×</span>
                            </span>
                            <input
                                type="range"
                                className={sliderClass}
                                min={AR_SCALE_RANGE.min}
                                max={AR_SCALE_RANGE.max}
                                step={AR_SCALE_RANGE.step}
                                {...register('arScale', { valueAsNumber: true })}
                            />
                        </label>
                        <label className="block space-y-1">
                            <span className="flex justify-between text-sm font-medium text-gray-700">
                                {t('seller.products.ar.offsetY')}
                                <span className="font-mono text-gray-500">{Number(arOffsetY).toFixed(2)}</span>
                            </span>
                            <input
                                type="range"
                                className={sliderClass}
                                min={AR_OFFSET_RANGE.min}
                                max={AR_OFFSET_RANGE.max}
                                step={AR_OFFSET_RANGE.step}
                                {...register('arOffsetY', { valueAsNumber: true })}
                            />
                        </label>
                    </div>

                    {productId && (
                        <Link
                            to="/try-on/$id"
                            params={{ id: productId }}
                            target="_blank"
                            className={buttonClass({ variant: 'soft', size: 'sm', className: 'w-fit' })}
                        >
                            <Camera aria-hidden />
                            {t('seller.products.ar.preview')}
                        </Link>
                    )}
                </>
            )}
        </div>
    )
}
