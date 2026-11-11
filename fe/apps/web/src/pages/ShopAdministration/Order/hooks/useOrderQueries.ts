import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchOrderDetail, searchOrders } from '../../services/shopAdminService'
import type { OrderFilterRequest } from '../../types'

export const orderKeys = {
    all: ['shop-admin', 'order'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (filters: OrderFilterRequest) => [...orderKeys.lists(), filters] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: string) => [...orderKeys.details(), id] as const,
}

export const useOrders = (filters: OrderFilterRequest) =>
    useQuery({
        queryKey: orderKeys.list(filters),
        queryFn: () => searchOrders(filters),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })

export const useOrderDetail = (id: string | null) =>
    useQuery({
        queryKey: orderKeys.detail(id ?? ''),
        queryFn: () => fetchOrderDetail(id as string),
        enabled: !!id,
        gcTime: 0,
        refetchOnWindowFocus: false,
    })
