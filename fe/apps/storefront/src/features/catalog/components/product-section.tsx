import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProductGrid } from '@/components/product/product-card'
import type { ProductSort, ProductCard } from '@/types/shop'

interface ProductSectionProps {
    title: string
    icon?: ReactNode
    products: ProductCard[]
    sort?: ProductSort
    accent?: boolean
}

/** Titled product strip with a "see all" link to the listing page. */
export function ProductSection({ title, icon, products, sort, accent }: ProductSectionProps) {
    const { t } = useTranslation()
    if (products.length === 0) return null
    return (
        <section className="rounded-xl bg-white p-3 sm:p-4" aria-label={title}>
            <div className="mb-3 flex items-center justify-between">
                <h2
                    className={`flex items-center gap-2 text-lg font-bold uppercase ${accent ? 'text-brand-600' : 'text-gray-800'}`}
                >
                    {icon}
                    {title}
                </h2>
                {sort && (
                    <Link
                        to="/search"
                        search={{ sort }}
                        className="flex items-center text-sm text-brand-600 hover:underline"
                    >
                        {t('common.viewAll')}
                        <ChevronRight className="size-4" aria-hidden />
                    </Link>
                )}
            </div>
            <ProductGrid products={products} />
        </section>
    )
}
