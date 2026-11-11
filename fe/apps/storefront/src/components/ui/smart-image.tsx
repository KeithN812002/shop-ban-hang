import { useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string | null | undefined
    alt: string
}

/** Resolves backend media URLs, lazy-loads and falls back to a placeholder on error / missing src. */
export function SmartImage({ src, alt, className, ...rest }: SmartImageProps) {
    const resolved = resolveMediaUrl(src)
    const [failedSrc, setFailedSrc] = useState<string | null>(null)

    if (!resolved || failedSrc === resolved) {
        return (
            <div
                role="img"
                aria-label={alt}
                className={cn('flex items-center justify-center bg-gray-100 text-gray-300', className)}
            >
                <ImageOff className="size-1/3 max-h-10 max-w-10" aria-hidden />
            </div>
        )
    }
    return (
        <img
            src={resolved}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setFailedSrc(resolved)}
            className={className}
            {...rest}
        />
    )
}
