import {
    Baby,
    Dumbbell,
    Gem,
    Glasses,
    HardHat,
    Laptop,
    Shirt,
    Smartphone,
    Sofa,
    Sparkles,
    Tag,
    Watch,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { SmartImage } from '@/components/ui/smart-image'
import type { CategoryNode } from '@/types/shop'

/**
 * `shop_category.icon` stores a lucide icon name, not a URL. Only the names used by the category seed are mapped
 * (importing lucide's full icon index would ship every icon); any other name falls back to a generic tag.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Baby,
    Dumbbell,
    Gem,
    Glasses,
    HardHat,
    Laptop,
    Shirt,
    Smartphone,
    Sofa,
    Sparkles,
    Watch,
}

interface CategoryIconProps {
    category: Pick<CategoryNode, 'name' | 'icon' | 'imageUrl'>
    /** Icon of the parent category, used by sub-categories that have no icon of their own. */
    fallbackIcon?: string | null
    className?: string
}

/** Category picture: its uploaded image when there is one, otherwise its icon on a round brand-tinted badge. */
export function CategoryIcon({ category, fallbackIcon, className }: CategoryIconProps) {
    if (category.imageUrl) {
        return (
            <SmartImage
                src={category.imageUrl}
                alt={category.name}
                className={cn('rounded-full object-cover', className)}
            />
        )
    }
    const Icon = CATEGORY_ICONS[category.icon ?? ''] ?? CATEGORY_ICONS[fallbackIcon ?? ''] ?? Tag
    return (
        <span
            role="img"
            aria-label={category.name}
            className={cn('flex items-center justify-center rounded-full bg-brand-50 text-brand-600', className)}
        >
            <Icon className="size-1/2" aria-hidden />
        </span>
    )
}
