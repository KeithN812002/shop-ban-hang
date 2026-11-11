import type { ProductSearchParams, ProductSort } from '@/types/shop'

export const PRODUCT_SORTS: ProductSort[] = ['relevance', 'newest', 'best_selling', 'price_asc', 'price_desc', 'popular']

/** URL-synced listing filters (`page` is 1-based, mapped to pageNumber for the API). */
export interface SearchFilters {
    keyword?: string
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    sort?: ProductSort
    page?: number
}

const asString = (value: unknown): string | undefined => {
    if (value === undefined || value === null) return undefined
    const text = String(value).trim()
    return text ? text : undefined
}

const asNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Router `validateSearch`: tolerant parsing, unknown / invalid values are dropped. */
export const parseSearchFilters = (raw: Record<string, unknown>): SearchFilters => {
    const sort = asString(raw.sort) as ProductSort | undefined
    const page = asNumber(raw.page)
    return {
        keyword: asString(raw.keyword),
        categoryId: asString(raw.categoryId),
        minPrice: asNumber(raw.minPrice),
        maxPrice: asNumber(raw.maxPrice),
        minRating: asNumber(raw.minRating),
        sort: sort && PRODUCT_SORTS.includes(sort) ? sort : undefined,
        page: page && page > 1 ? Math.floor(page) : undefined,
    }
}

export const PAGE_SIZE = 20

export const toApiParams = (filters: SearchFilters, extra: Partial<ProductSearchParams> = {}): ProductSearchParams => ({
    keyword: filters.keyword,
    categoryId: filters.categoryId,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minRating: filters.minRating,
    sort: filters.sort ?? 'relevance',
    pageNumber: filters.page ?? 1,
    pageSize: PAGE_SIZE,
    ...extra,
})
