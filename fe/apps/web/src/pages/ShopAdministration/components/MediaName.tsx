import { memo } from 'react'
import { Package, type LucideIcon } from 'lucide-react'
import { resolveMediaUrl } from '../utils/format'

interface MediaNameProps {
    name: string
    imageUrl?: string | null
    subtitle?: string | null
    /** Placeholder shown when there is no image. */
    icon?: LucideIcon
}

/** Thumbnail (or placeholder icon) next to a name and an optional muted subtitle. */
export const MediaName = memo(({ name, imageUrl, subtitle, icon: Icon = Package }: MediaNameProps) => {
    const src = resolveMediaUrl(imageUrl)
    return (
        <div className="flex items-center gap-2 min-w-0">
            {src ? (
                <img src={src} alt="" className="size-8 shrink-0 rounded object-cover" loading="lazy" />
            ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                </span>
            )}
            <div className="min-w-0">
                <div className="truncate font-medium">{name}</div>
                {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
            </div>
        </div>
    )
})

MediaName.displayName = 'MediaName'
