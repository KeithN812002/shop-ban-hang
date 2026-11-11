import { createFileRoute, Link } from '@tanstack/react-router'
import { Flame, Sparkles, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { ProductGridSkeleton } from '@/components/product/product-card'
import { Carousel } from '@/components/ui/carousel'
import { ErrorState } from '@/components/ui/feedback'
import { CategoryIcon } from '@/features/catalog/components/category-icon'
import { ProductSection } from '@/features/catalog/components/product-section'
import { useHome } from '@/features/catalog/queries'

export const Route = createFileRoute('/')({ component: HomePage })

const BANNERS = [
    { key: 'flash', gradient: 'from-brand-500 to-amber-400', sort: 'popular' },
    { key: 'newest', gradient: 'from-sky-500 to-indigo-500', sort: 'newest' },
    { key: 'bestSeller', gradient: 'from-emerald-500 to-teal-400', sort: 'best_selling' },
] as const

function HomePage() {
    const { t } = useTranslation()
    const home = useHome()

    return (
        <div className="container-page space-y-4 py-4">
            <Carousel
                className="aspect-[16/7] sm:aspect-[3/1]"
                slides={BANNERS.map(banner => (
                    <div
                        key={banner.key}
                        className={`flex size-full flex-col justify-center bg-linear-to-r ${banner.gradient} p-6 text-white sm:p-12`}
                    >
                        <p className="text-xs font-semibold tracking-widest uppercase opacity-90">
                            {t(`home.banners.${banner.key}.tag`)}
                        </p>
                        <h2 className="mt-1 max-w-lg text-2xl font-extrabold sm:text-4xl">
                            {t(`home.banners.${banner.key}.title`)}
                        </h2>
                        <p className="mt-2 max-w-md text-sm opacity-95 sm:text-base">
                            {t(`home.banners.${banner.key}.subtitle`)}
                        </p>
                        <Link
                            to="/search"
                            search={{ sort: banner.sort }}
                            className="mt-4 w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-600 shadow hover:bg-brand-50"
                        >
                            {t('home.shopNow')}
                        </Link>
                    </div>
                ))}
            />

            {home.isError && <ErrorState onRetry={() => void home.refetch()} />}

            {home.isLoading && (
                <>
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <ProductGridSkeleton count={5} />
                    <ProductGridSkeleton count={10} />
                </>
            )}

            {home.data && (
                <>
                    {home.data.categories.length > 0 && (
                        <section className="rounded-xl bg-white p-3 sm:p-4" aria-label={t('home.categories')}>
                            <h2 className="mb-3 text-lg font-bold text-gray-800 uppercase">{t('home.categories')}</h2>
                            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                                {home.data.categories.map(category => (
                                    <li key={category.id}>
                                        <Link
                                            to="/search"
                                            search={{ categoryId: category.id }}
                                            className="flex flex-col items-center gap-2 rounded-lg p-2 text-center text-xs text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                                        >
                                            <CategoryIcon category={category} className="size-14 border" />
                                            <span className="line-clamp-2">{category.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <ProductSection
                        accent
                        title={t('home.flashDeals')}
                        icon={<Zap className="size-5 fill-amber-400 text-amber-400" aria-hidden />}
                        products={home.data.flashDeals}
                        sort="popular"
                    />
                    <ProductSection
                        title={t('home.trending')}
                        icon={<TrendingUp className="size-5 text-brand-500" aria-hidden />}
                        products={home.data.trending}
                        sort="popular"
                    />
                    <ProductSection
                        title={t('home.bestSellers')}
                        icon={<Trophy className="size-5 text-amber-500" aria-hidden />}
                        products={home.data.bestSellers}
                        sort="best_selling"
                    />
                    <ProductSection
                        title={t('home.newArrivals')}
                        icon={<Sparkles className="size-5 text-sky-500" aria-hidden />}
                        products={home.data.newArrivals}
                        sort="newest"
                    />
                    {home.data.trending.length +
                        home.data.bestSellers.length +
                        home.data.newArrivals.length +
                        home.data.flashDeals.length ===
                        0 && (
                        <div className="rounded-xl bg-white py-12 text-center text-gray-500">
                            <Flame className="mx-auto mb-2 size-10 text-gray-300" aria-hidden />
                            {t('home.noProducts')}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
