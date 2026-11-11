import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchProductDetail, searchProducts } from '../../services/shopAdminService'
import type { ProductFilterRequest } from '../../types'

export const productKeys = {
    all: ['shop-admin', 'product'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductFilterRequest) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
}

export const useProducts = (filters: ProductFilterRequest) =>
    useQuery({
        queryKey: productKeys.list(filters),
        queryFn: () => searchProducts(filters),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })

export const useProductDetail = (id: string | null) =>
    useQuery({
        queryKey: productKeys.detail(id ?? ''),
        queryFn: () => fetchProductDetail(id as string),
        enabled: !!id,
        gcTime: 0,
        refetchOnWindowFocus: false,
    })
