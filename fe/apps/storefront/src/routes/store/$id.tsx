import { useEffect, useState, type FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { SmartImage } from '@/components/ui/smart-image'
import { SortTabs } from '@/features/catalog/components/sort-tabs'
import { useProductSearch, useStore } from '@/features/catalog/queries'
import { parseSearchFilters, toApiParams, type SearchFilters } from '@/features/catalog/search-params'
import { StoreCard } from '@/features/product/components/store-card'

export const Route = createFileRoute('/store/$id')({
    validateSearch: (raw: Record<string, unknown>): Pick<SearchFilters, 'keyword' | 'sort' | 'page'> => {
        const { keyword, sort, page } = parseSearchFilters(raw)
        return { keyword, sort, page }
    },
    component: StorePage,
})

function StorePage() {
    const { id } = Route.useParams()
    const filters = Route.useSearch()
    const { t } = useTranslation()
    const navigate = useNavigate({ from: Route.fullPath })
    const store = useStore(id)
    const products = useProductSearch(toApiParams(filters, { storeId: id }))
    const [draft, setDraft] = useState(filters.keyword ?? '')

    useEffect(() => setDraft(filters.keyword ?? ''), [filters.keyword])

    const onSearch = (event: FormEvent) => {
        event.preventDefault()
        void navigate({ search: prev => ({ ...prev, keyword: draft.trim() || undefined, page: undefined }) })
    }

    if (store.isError) {
        return (
            <div className="container-page py-8">
                <ErrorState onRetry={() => void store.refetch()} />
            </div>
        )
    }

    return (
        <div className="container-page space-y-4 py-4">
            {store.isLoading || !store.data ? (
                <Skeleton className="h-56 w-full rounded-xl" />
            ) : (
                <div className="overflow-hidden rounded-xl bg-white">
                    <div className="h-32 bg-linear-to-r from-brand-400 to-amber-400 sm:h-48">
                        {store.data.bannerUrl && (
                            <SmartImage src={store.data.bannerUrl} alt={store.data.name} className="size-full object-cover" />
                        )}
                    </div>
                    <StoreCard store={store.data} showVisit={false} />
                    {store.data.description && (
                        <p className="border-t px-4 py-3 text-sm whitespace-pre-line text-gray-600">{store.data.description}</p>
                    )}
                </div>
            )}

            <form onSubmit={onSearch} role="search" className="flex gap-2 rounded-xl bg-white p-3">
                <Input
                    type="search"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    placeholder={t('store.searchPlaceholder')}
                    aria-label={t('store.searchPlaceholder')}
                />
                <Button type="submit" icon={<Search />}>
                    {t('header.search')}
                </Button>
            </form>

            <SortTabs
                value={filters.sort ?? 'relevance'}
                onChange={sort => void navigate({ search: prev => ({ ...prev, sort, page: undefined }) })}
            />

            {products.isLoading && <ProductGridSkeleton count={10} />}
            {products.isError && <ErrorState onRetry={() => void products.refetch()} />}
            {products.data && products.data.items.length === 0 && (
                <div className="rounded-xl bg-white">
                    <EmptyState kind={filters.keyword ? 'no-match' : 'empty'} title={t('store.noProducts')} />
                </div>
            )}
            {products.data && products.data.items.length > 0 && <ProductGrid products={products.data.items} />}
            {products.data && (
                <Pagination
                    page={filters.page ?? 1}
                    totalPages={products.data.totalPages}
                    onChange={page => {
                        void navigate({ search: prev => ({ ...prev, page: page > 1 ? page : undefined }) })
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                />
            )}
        </div>
    )
}
