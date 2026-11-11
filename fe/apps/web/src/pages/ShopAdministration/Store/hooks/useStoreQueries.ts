import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchStoreDetail, searchStores } from '../../services/shopAdminService'
import type { StoreFilterRequest } from '../../types'

export const storeKeys = {
    all: ['shop-admin', 'store'] as const,
    lists: () => [...storeKeys.all, 'list'] as const,
    list: (filters: StoreFilterRequest) => [...storeKeys.lists(), filters] as const,
    details: () => [...storeKeys.all, 'detail'] as const,
    detail: (id: string) => [...storeKeys.details(), id] as const,
}

export const useStores = (filters: StoreFilterRequest) =>
    useQuery({
        queryKey: storeKeys.list(filters),
        queryFn: () => searchStores(filters),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })

export const useStoreDetail = (id: string | null) =>
    useQuery({
        queryKey: storeKeys.detail(id ?? ''),
        queryFn: () => fetchStoreDetail(id as string),
        enabled: !!id,
        gcTime: 0,
        refetchOnWindowFocus: false,
    })
