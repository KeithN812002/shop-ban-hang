import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { useWishlist } from '@/features/account/queries'

export const Route = createFileRoute('/account/wishlist')({ component: WishlistPage })

function WishlistPage() {
    const { t } = useTranslation()
    const wishlist = useWishlist()
    return (
        <section className="rounded-xl bg-white p-5" aria-label={t('account.menu.wishlist')}>
            <h1 className="mb-4 text-lg font-bold text-gray-900">{t('account.menu.wishlist')}</h1>
            {wishlist.isLoading && <ProductGridSkeleton count={5} className="lg:grid-cols-4" />}
            {wishlist.isError && <ErrorState onRetry={() => void wishlist.refetch()} />}
            {wishlist.data?.length === 0 && (
                <EmptyState
                    title={t('wishlist.empty')}
                    action={
                        <Link to="/" className={buttonClass()}>
                            {t('cart.continueShopping')}
                        </Link>
                    }
                />
            )}
            {wishlist.data && wishlist.data.length > 0 && (
                <ProductGrid products={wishlist.data} className="lg:grid-cols-4" />
            )}
        </section>
    )
}
