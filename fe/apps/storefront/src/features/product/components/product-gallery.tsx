import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { SmartImage } from '@/components/ui/smart-image'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
    const { t } = useTranslation()
    const [active, setActive] = useState(0)
    const current = images[Math.min(active, Math.max(images.length - 1, 0))]

    return (
        <div className="space-y-2">
            <div className="aspect-square overflow-hidden rounded-lg border bg-gray-50">
                <SmartImage src={current} alt={name} className="size-full object-contain" loading="eager" />
            </div>
            {images.length > 1 && (
                <ul className="scrollbar-hide flex gap-2 overflow-x-auto" aria-label={t('product.gallery')}>
                    {images.map((image, index) => (
                        <li key={`${image}-${index}`} className="shrink-0">
                            <button
                                type="button"
                                onClick={() => setActive(index)}
                                onMouseEnter={() => setActive(index)}
                                aria-label={`${t('product.image')} ${index + 1}`}
                                aria-current={index === active}
                                className={cn(
                                    'size-16 overflow-hidden rounded-md border-2 sm:size-20',
                                    index === active ? 'border-brand-500' : 'border-transparent hover:border-brand-300',
                                )}
                            >
                                <SmartImage src={image} alt="" className="size-full object-cover" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
