import { Link } from '@tanstack/react-router'
import { Camera, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Price } from '@/components/ui/price'
import { RatingStars } from '@/components/ui/rating-stars'
import { SmartImage } from '@/components/ui/smart-image'
import { formatCompact } from '@/lib/format'
import type { ProductCard as ProductCardData } from '@/types/shop'

interface ProductCardProps {
    product: ProductCardData
    className?: string
    /** Compact variant for horizontal strips (chatbot) */
    compact?: boolean
}

export function ProductCard({ product, className, compact }: ProductCardProps) {
    const { t } = useTranslation()
    const hasAr = product.arType !== 'NONE'
    return (
        <Link
            to="/product/$id"
            params={{ id: product.id }}
            className={cn(
                'group flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
                className,
            )}
        >
            <div className="relative aspect-square overflow-hidden bg-gray-100">
                <SmartImage
                    src={product.thumbnailUrl}
                    alt={product.name}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {(product.discountPercent ?? 0) > 0 && (
                    <span className="absolute top-0 right-0 rounded-bl-md bg-amber-400 px-1.5 py-1 text-xs font-bold text-brand-700">
                        -{product.discountPercent}%
                    </span>
                )}
                {hasAr && (
                    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                        <Camera className="size-3" aria-hidden />
                        {t('product.tryOnBadge')}
                    </span>
                )}
            </div>
            <div className={cn('flex flex-1 flex-col gap-1.5', compact ? 'p-2' : 'p-2.5')}>
                <h3 className={cn('line-clamp-2 text-gray-800', compact ? 'min-h-8 text-xs' : 'min-h-10 text-sm')}>
                    {product.name}
                </h3>
                <Price value={product.price} original={product.originalPrice} discountPercent={null} size="sm" />
                {!compact && product.promotionName && (
                    <p className="truncate text-xs font-medium text-brand-600">{product.promotionName}</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-gray-500">
                    {product.ratingCount > 0 ? (
                        <RatingStars value={product.ratingAvg} size={12} />
                    ) : (
                        <span>{t('product.noReviewsShort')}</span>
                    )}
                    <span>{t('product.sold', { value: formatCompact(product.soldCount) })}</span>
                </div>
                {!compact && product.province && (
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="size-3" aria-hidden />
                        {product.province}
                    </p>
                )}
            </div>
        </Link>
    )
}

export function ProductCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-lg border bg-white">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        </div>
    )
}

const gridClass = 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5'

export function ProductGrid({ products, className }: { products: ProductCardData[]; className?: string }) {
    return (
        <div className={cn(gridClass, className)}>
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}

export function ProductGridSkeleton({ count = 10, className }: { count?: number; className?: string }) {
    return (
        <div className={cn(gridClass, className)}>
            {Array.from({ length: count }, (_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}
