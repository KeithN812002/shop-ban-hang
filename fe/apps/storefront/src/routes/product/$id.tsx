import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Camera, Heart, ShoppingCart, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { useRequireLogin } from '@/components/auth/require-auth'
import { ProductGrid } from '@/components/product/product-card'
import { PromotionStrip } from '@/components/product/promotion-strip'
import { Button, buttonClass } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/feedback'
import { Price } from '@/components/ui/price'
import { QuantityInput } from '@/components/ui/quantity-input'
import { RatingStars } from '@/components/ui/rating-stars'
import { useToggleWishlist, useWishlist } from '@/features/account/queries'
import { useAddToCart, useBuyNow } from '@/features/cart/queries'
import { useProduct, useRelatedProducts } from '@/features/catalog/queries'
import { ProductGallery } from '@/features/product/components/product-gallery'
import { ReviewsSection } from '@/features/product/components/reviews-section'
import { StoreCard } from '@/features/product/components/store-card'
import { formatCompact } from '@/lib/format'
import { ApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { useAuth } from '@/providers/auth-provider'

export const Route = createFileRoute('/product/$id')({ component: ProductPage })

function ProductPage() {
    const { id } = Route.useParams()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const requireLogin = useRequireLogin()
    const product = useProduct(id)
    const related = useRelatedProducts(id)
    const wishlist = useWishlist()
    const toggleWishlist = useToggleWishlist()
    const addToCart = useAddToCart()
    const buyNow = useBuyNow()

    const [variantId, setVariantId] = useState<string | null>(null)
    const [quantity, setQuantity] = useState(1)

    if (product.isLoading) {
        return (
            <div className="container-page grid gap-6 py-6 md:grid-cols-2">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (product.isError || !product.data) {
        const notFound = product.error instanceof ApiError && product.error.status === 404
        return (
            <div className="container-page py-8">
                <ErrorState onRetry={notFound ? undefined : () => void product.refetch()} />
            </div>
        )
    }

    const p = product.data
    const hasVariants = p.variants.length > 0
    const variant = p.variants.find(v => v.id === variantId) ?? null
    const unitPrice = variant?.price ?? p.price
    const stock = variant ? variant.stock : hasVariants ? p.variants.reduce((sum, v) => sum + v.stock, 0) : p.stock
    const outOfStock = stock <= 0
    const images = p.images.length > 0 ? p.images : p.thumbnailUrl ? [p.thumbnailUrl] : []
    const liked = wishlist.data?.some(item => item.id === p.id) ?? false
    const hasAr = p.arType !== 'NONE'

    const ensureVariant = (): boolean => {
        if (hasVariants && !variant) {
            notify.error(t('product.selectVariant'))
            return false
        }
        if (outOfStock) {
            notify.error(t('product.outOfStock'))
            return false
        }
        return true
    }

    const payload = { productId: p.id, variantId: variant?.id ?? null, quantity }

    const onAddToCart = () => {
        if (!ensureVariant() || !requireLogin()) return
        addToCart.mutate(payload, { onSuccess: () => notify.success(t('product.addedToCart')) })
    }

    const onBuyNow = () => {
        if (!ensureVariant() || !requireLogin()) return
        buyNow.mutate(payload, { onSuccess: () => void navigate({ to: '/checkout' }) })
    }

    const onWishlist = () => {
        if (!requireLogin()) return
        toggleWishlist.mutate(p.id, {
            onSuccess: result => notify.success(t(result.liked ? 'product.wishlistAdded' : 'product.wishlistRemoved')),
        })
    }

    return (
        <div className="container-page space-y-4 py-4">
            <nav aria-label="breadcrumb" className="text-sm text-gray-500">
                <Link to="/" className="hover:text-brand-600">
                    {t('common.home')}
                </Link>
                {p.categoryName && p.categoryId && (
                    <>
                        {' / '}
                        <Link to="/search" search={{ categoryId: p.categoryId }} className="hover:text-brand-600">
                            {p.categoryName}
                        </Link>
                    </>
                )}
                {' / '}
                <span className="text-gray-800">{p.name}</span>
            </nav>

            <section className="grid gap-6 rounded-xl bg-white p-4 sm:p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <ProductGallery images={images} name={p.name} />

                <div className="space-y-4">
                    <h1 className="text-xl leading-snug font-semibold text-gray-900 sm:text-2xl">{p.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        {p.ratingCount > 0 ? (
                            <span className="flex items-center gap-1.5">
                                <span className="font-semibold text-brand-600 underline">{p.ratingAvg.toFixed(1)}</span>
                                <RatingStars value={p.ratingAvg} size={15} />
                                <span>({t('review.count', { count: p.ratingCount })})</span>
                            </span>
                        ) : (
                            <span>{t('product.noReviews')}</span>
                        )}
                        <span>{t('product.sold', { value: formatCompact(p.soldCount) })}</span>
                    </div>

                    {p.promotionEndAt && <PromotionStrip name={p.promotionName} endAt={p.promotionEndAt} />}

                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                        <Price value={unitPrice} original={variant ? null : p.originalPrice} discountPercent={p.discountPercent} size="lg" />
                    </div>

                    {hasAr && (
                        <Link
                            to="/try-on/$id"
                            params={{ id: p.id }}
                            className={cn(
                                buttonClass({ variant: 'dark', size: 'lg', block: true }),
                                'bg-linear-to-r from-brand-500 to-amber-500 shadow-md hover:from-brand-600 hover:to-amber-600',
                            )}
                        >
                            <Camera aria-hidden />
                            {t('product.tryOn')}
                        </Link>
                    )}

                    {hasVariants && (
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium text-gray-700">{t('product.variant')}</legend>
                            <div className="flex flex-wrap gap-2">
                                {p.variants.map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        disabled={v.stock <= 0}
                                        aria-pressed={v.id === variantId}
                                        onClick={() => {
                                            setVariantId(v.id)
                                            setQuantity(q => Math.min(q, Math.max(v.stock, 1)))
                                        }}
                                        className={cn(
                                            'rounded-md border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through',
                                            v.id === variantId
                                                ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                : 'hover:border-brand-400',
                                        )}
                                    >
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">{t('product.quantity')}</span>
                        <QuantityInput value={quantity} onChange={setQuantity} max={Math.max(stock, 1)} disabled={outOfStock} />
                        <span className={cn('text-sm', outOfStock ? 'font-medium text-red-600' : 'text-gray-500')}>
                            {outOfStock ? t('product.outOfStock') : t('product.stock', { count: stock })}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            variant="soft"
                            size="lg"
                            icon={<ShoppingCart />}
                            loading={addToCart.isPending}
                            disabled={outOfStock}
                            onClick={onAddToCart}
                            className="flex-1 sm:flex-none"
                        >
                            {t('product.addToCart')}
                        </Button>
                        <Button
                            size="lg"
                            icon={<Zap />}
                            loading={buyNow.isPending}
                            disabled={outOfStock}
                            onClick={onBuyNow}
                            className="flex-1 sm:flex-none"
                        >
                            {t('product.buyNow')}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            aria-pressed={liked}
                            aria-label={t(liked ? 'product.wishlistRemove' : 'product.wishlistAdd')}
                            loading={toggleWishlist.isPending}
                            onClick={onWishlist}
                            icon={<Heart className={cn(liked && 'fill-brand-500 text-brand-500')} />}
                        >
                            <span className="hidden sm:inline">
                                {t(liked ? 'product.wishlistRemove' : 'product.wishlistAdd')}
                            </span>
                        </Button>
                    </div>
                    {!isAuthenticated && <p className="text-xs text-gray-500">{t('product.loginHint')}</p>}
                </div>
            </section>

            <StoreCard store={p.store} />

            <section className="rounded-xl bg-white p-4 sm:p-6" aria-label={t('product.description')}>
                <h2 className="mb-3 text-lg font-bold text-gray-900 uppercase">{t('product.description')}</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">
                    {p.description || t('product.noDescription')}
                </p>
                {p.tags.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {p.tags.map(tag => (
                            <li key={tag}>
                                <Link
                                    to="/search"
                                    search={{ keyword: tag }}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-brand-50 hover:text-brand-600"
                                >
                                    #{tag}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <ReviewsSection productId={p.id} />

            {related.data && related.data.length > 0 && (
                <section aria-label={t('product.related')} className="rounded-xl bg-white p-4 sm:p-6">
                    <h2 className="mb-3 text-lg font-bold text-gray-900 uppercase">{t('product.related')}</h2>
                    <ProductGrid products={related.data} />
                </section>
            )}
        </div>
    )
}
