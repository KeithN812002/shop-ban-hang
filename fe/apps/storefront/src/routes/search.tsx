import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { FilterPanel } from '@/features/catalog/components/filter-panel'
import { SortTabs } from '@/features/catalog/components/sort-tabs'
import { useProductSearch } from '@/features/catalog/queries'
import { parseSearchFilters, toApiParams, type SearchFilters } from '@/features/catalog/search-params'

export const Route = createFileRoute('/search')({
    validateSearch: parseSearchFilters,
    component: SearchPage,
})

function SearchPage() {
    const { t } = useTranslation()
    const filters = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })
    const [showFilters, setShowFilters] = useState(false)
    const query = useProductSearch(toApiParams(filters))

    // Any filter change resets to page 1.
    const update = (patch: Partial<SearchFilters>) =>
        void navigate({ search: prev => ({ ...prev, ...patch, page: undefined }) })
    const goToPage = (page: number) => {
        void navigate({ search: prev => ({ ...prev, page: page > 1 ? page : undefined }) })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const clear = () => void navigate({ search: { keyword: filters.keyword } })

    const data = query.data
    const hasFilter = Boolean(
        filters.categoryId || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.minRating,
    )

    return (
        <div className="container-page py-4">
            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <div className={showFilters ? 'block' : 'hidden lg:block'}>
                    <FilterPanel filters={filters} onChange={update} onClear={clear} />
                </div>

                <div className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-base text-gray-700">
                            {filters.keyword
                                ? t('search.resultsFor', { keyword: filters.keyword })
                                : t('search.allProducts')}
                            {data && (
                                <span className="ml-2 text-sm text-gray-500">
                                    ({t('search.total', { count: data.totalElements })})
                                </span>
                            )}
                        </h1>
                        <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden"
                            aria-expanded={showFilters}
                            icon={<SlidersHorizontal />}
                            onClick={() => setShowFilters(v => !v)}
                        >
                            {t('search.filters')}
                        </Button>
                    </div>

                    <SortTabs value={filters.sort ?? 'relevance'} onChange={sort => update({ sort })} />

                    {query.isLoading && <ProductGridSkeleton count={10} />}
                    {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
                    {data && data.items.length === 0 && (
                        <div className="rounded-lg bg-white">
                            <EmptyState
                                kind="no-match"
                                title={t('search.noResults')}
                                description={t('search.noResultsHint')}
                                action={
                                    hasFilter && (
                                        <Button variant="outline" onClick={clear}>
                                            {t('search.clearFilters')}
                                        </Button>
                                    )
                                }
                            />
                        </div>
                    )}
                    {data && data.items.length > 0 && (
                        <div className={query.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
                            <ProductGrid products={data.items} className="lg:grid-cols-4 xl:grid-cols-4" />
                        </div>
                    )}
                    {data && (
                        <Pagination
                            className="pt-4"
                            page={filters.page ?? 1}
                            totalPages={data.totalPages}
                            onChange={goToPage}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
