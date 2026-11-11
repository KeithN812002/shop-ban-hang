import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { SmartImage } from '@/components/ui/smart-image'
import { uploadImage } from '@/features/account/api'
import { getErrorMessage } from '@/lib/http'
import { notify } from '@/lib/notify'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface ImageUploaderProps {
    /** Uploaded image URLs (as returned by POST /shop/me/file/upload) */
    value: string[]
    onChange: (urls: string[]) => void
    /** Max number of images; 1 = single-image mode (replaces the current one) */
    max?: number
    label?: string
    className?: string
}

/**
 * Shared image picker used by reviews, store/shipper registration and the seller center.
 * Validates type/size on the client, uploads each file to POST /shop/me/file/upload.
 */
export function ImageUploader({ value, onChange, max = 5, label, className }: ImageUploaderProps) {
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement>(null)
    const [pending, setPending] = useState(0)

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const room = max === 1 ? 1 : max - value.length
        const picked = Array.from(files).slice(0, Math.max(room, 0))
        if (picked.length < files.length && max !== 1) notify.info(t('uploader.maxReached', { max }))

        const uploaded: string[] = []
        for (const file of picked) {
            if (!file.type.startsWith('image/')) {
                notify.error(t('uploader.notImage', { name: file.name }))
                continue
            }
            if (file.size > MAX_IMAGE_BYTES) {
                notify.error(t('uploader.tooLarge', { name: file.name }))
                continue
            }
            setPending(n => n + 1)
            try {
                const { url } = await uploadImage(file)
                uploaded.push(url)
            } catch (error) {
                notify.error(getErrorMessage(error, t('uploader.failed', { name: file.name })))
            } finally {
                setPending(n => n - 1)
            }
        }
        if (uploaded.length > 0) onChange(max === 1 ? uploaded.slice(0, 1) : [...value, ...uploaded])
        if (inputRef.current) inputRef.current.value = ''
    }

    const canAdd = max === 1 ? true : value.length < max

    return (
        <div className={cn('space-y-2', className)}>
            {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
            <div className="flex flex-wrap gap-2">
                {value.map(url => (
                    <div key={url} className="group relative size-20 overflow-hidden rounded-md border">
                        <SmartImage src={url} alt={t('uploader.preview')} className="size-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange(value.filter(item => item !== url))}
                            aria-label={t('uploader.remove')}
                            className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                ))}
                {Array.from({ length: pending }, (_, i) => (
                    <div key={`pending-${i}`} className="flex size-20 items-center justify-center rounded-md border bg-gray-50">
                        <Loader2 className="size-5 animate-spin text-brand-500" aria-label={t('common.loading')} />
                    </div>
                ))}
                {canAdd && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand-500 hover:text-brand-600"
                    >
                        <ImagePlus className="size-5" aria-hidden />
                        {t('uploader.add')}
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={max > 1}
                hidden
                onChange={event => void handleFiles(event.target.files)}
            />
        </div>
    )
}
