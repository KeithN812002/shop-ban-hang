import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Uuid } from '@/types/api'
import type { ProductSearchParams } from '@/types/shop'
import {
    getCategoryTree,
    getHome,
    getProduct,
    getProductReviews,
    getRelatedProducts,
    getReviewSummary,
    getStore,
    searchProducts,
    suggestProducts,
    type ReviewQuery,
} from './api'

export const catalogKeys = {
    all: ['catalog'] as const,
    home: () => [...catalogKeys.all, 'home'] as const,
    categories: () => [...catalogKeys.all, 'categories'] as const,
    search: (params: ProductSearchParams) => [...catalogKeys.all, 'search', params] as const,
    suggest: (keyword: string) => [...catalogKeys.all, 'suggest', keyword] as const,
    product: (id: Uuid) => [...catalogKeys.all, 'product', id] as const,
    related: (id: Uuid) => [...catalogKeys.all, 'related', id] as const,
    reviews: (id: Uuid, query: ReviewQuery) => [...catalogKeys.all, 'reviews', id, query] as const,
    reviewSummary: (id: Uuid) => [...catalogKeys.all, 'review-summary', id] as const,
    store: (id: Uuid) => [...catalogKeys.all, 'store', id] as const,
}

const FIVE_MIN = 5 * 60_000

export const useHome = () => useQuery({ queryKey: catalogKeys.home(), queryFn: getHome, staleTime: 60_000 })

export const useCategoryTree = () =>
    useQuery({ queryKey: catalogKeys.categories(), queryFn: getCategoryTree, staleTime: FIVE_MIN })

export const useProductSearch = (params: ProductSearchParams) =>
    useQuery({
        queryKey: catalogKeys.search(params),
        queryFn: () => searchProducts(params),
        placeholderData: keepPreviousData,
    })

export const useSuggest = (keyword: string) =>
    useQuery({
        queryKey: catalogKeys.suggest(keyword),
        queryFn: () => suggestProducts(keyword),
        enabled: keyword.trim().length >= 2,
        staleTime: 60_000,
    })

export const useProduct = (id: Uuid) =>
    useQuery({ queryKey: catalogKeys.product(id), queryFn: () => getProduct(id), staleTime: 30_000 })

export const useRelatedProducts = (id: Uuid) =>
    useQuery({ queryKey: catalogKeys.related(id), queryFn: () => getRelatedProducts(id), staleTime: 60_000 })

export const useProductReviews = (id: Uuid, query: ReviewQuery) =>
    useQuery({
        queryKey: catalogKeys.reviews(id, query),
        queryFn: () => getProductReviews(id, query),
        placeholderData: keepPreviousData,
    })

export const useReviewSummary = (id: Uuid) =>
    useQuery({ queryKey: catalogKeys.reviewSummary(id), queryFn: () => getReviewSummary(id) })

export const useStore = (id: Uuid) =>
    useQuery({ queryKey: catalogKeys.store(id), queryFn: () => getStore(id), staleTime: 60_000 })
