import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DateRangeParams } from '@/features/seller/types'
import type { Uuid } from '@/types/api'
import {
    acceptOrder,
    getOrder,
    getProfile,
    getStats,
    markDelivered,
    markFailed,
    markPickedUp,
    searchAvailableOrders,
    searchMyOrders,
} from './api'
import type { AvailableOrderParams, MyOrderParams } from './types'

export const shipperKeys = {
    all: ['shipper'] as const,
    profile: () => [...shipperKeys.all, 'profile'] as const,
    orders: () => [...shipperKeys.all, 'orders'] as const,
    available: (params: AvailableOrderParams) => [...shipperKeys.orders(), 'available', params] as const,
    mine: (params: MyOrderParams) => [...shipperKeys.orders(), 'mine', params] as const,
    order: (id: Uuid) => [...shipperKeys.orders(), 'detail', id] as const,
    stats: (range: DateRangeParams) => [...shipperKeys.all, 'stats', range] as const,
}

const AVAILABLE_POLL_MS = 30_000

export const useShipperProfile = () => useQuery({ queryKey: shipperKeys.profile(), queryFn: getProfile })

export const useAvailableOrders = (params: AvailableOrderParams) =>
    useQuery({
        queryKey: shipperKeys.available(params),
        queryFn: () => searchAvailableOrders(params),
        placeholderData: keepPreviousData,
        refetchInterval: AVAILABLE_POLL_MS,
    })

export const useMyOrders = (params: MyOrderParams) =>
    useQuery({
        queryKey: shipperKeys.mine(params),
        queryFn: () => searchMyOrders(params),
        placeholderData: keepPreviousData,
    })

export const useShipperOrder = (id: Uuid) =>
    useQuery({ queryKey: shipperKeys.order(id), queryFn: () => getOrder(id) })

const useInvalidateOrders = () => {
    const qc = useQueryClient()
    return () =>
        Promise.all([
            qc.invalidateQueries({ queryKey: shipperKeys.orders() }),
            qc.invalidateQueries({ queryKey: [...shipperKeys.all, 'stats'] }),
        ])
}

/**
 * Accepting can lose the race against another shipper: the call site handles the error itself
 * (meta.silent) and the lists are refreshed either way.
 */
export const useAcceptOrder = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({
        mutationFn: (id: Uuid) => acceptOrder(id),
        meta: { silent: true },
        onSettled: invalidate,
    })
}

export const usePickedUp = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: (id: Uuid) => markPickedUp(id), onSuccess: invalidate })
}

export const useDelivered = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: markDelivered, onSuccess: invalidate })
}

export const useFailed = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: markFailed, onSuccess: invalidate })
}

export const useShipperStats = (range: DateRangeParams) =>
    useQuery({ queryKey: shipperKeys.stats(range), queryFn: () => getStats(range) })
