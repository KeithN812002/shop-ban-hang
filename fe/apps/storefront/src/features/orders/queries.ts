import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meKeys } from '@/features/account/queries'
import { cartKeys } from '@/features/cart/queries'
import { catalogKeys } from '@/features/catalog/queries'
import { useAuth } from '@/providers/auth-provider'
import type { Uuid } from '@/types/api'
import type { OrderRequestBase } from '@/types/shop'
import {
    cancelOrder,
    confirmReceived,
    createOrder,
    createReview,
    disputeReturn,
    getAvailableVouchers,
    getOrder,
    previewOrder,
    requestReturn,
    searchOrders,
    type OrderSearchParams,
    withdrawReturn,
} from './api'

export const orderKeys = {
    all: [...meKeys.all, 'orders'] as const,
    list: (params: OrderSearchParams) => [...orderKeys.all, 'list', params] as const,
    detail: (id: Uuid) => [...orderKeys.all, 'detail', id] as const,
    vouchers: (storeId?: Uuid) => [...meKeys.all, 'vouchers', storeId ?? 'platform'] as const,
    preview: (req: OrderRequestBase) => [...orderKeys.all, 'preview', req] as const,
}

export const useOrders = (params: OrderSearchParams) => {
    const { isAuthenticated } = useAuth()
    return useQuery({
        queryKey: orderKeys.list(params),
        queryFn: () => searchOrders(params),
        enabled: isAuthenticated,
        placeholderData: keepPreviousData,
    })
}

export const useOrder = (id: Uuid) => {
    const { isAuthenticated } = useAuth()
    return useQuery({ queryKey: orderKeys.detail(id), queryFn: () => getOrder(id), enabled: isAuthenticated })
}

export const useVouchers = (storeId?: Uuid, enabled = true) =>
    useQuery({ queryKey: orderKeys.vouchers(storeId), queryFn: () => getAvailableVouchers(storeId), enabled })

/** Preview is a POST but side-effect free, so it is cached/refetched like a read. */
export const useOrderPreview = (req: OrderRequestBase | null) =>
    useQuery({
        queryKey: req ? orderKeys.preview(req) : [...orderKeys.all, 'preview', 'idle'],
        queryFn: () => previewOrder(req as OrderRequestBase),
        enabled: Boolean(req && req.addressId),
        placeholderData: keepPreviousData,
        retry: false,
    })

export const useCreateOrder = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createOrder,
        onSuccess: () =>
            Promise.all([
                qc.invalidateQueries({ queryKey: cartKeys.all }),
                qc.invalidateQueries({ queryKey: orderKeys.all }),
                qc.invalidateQueries({ queryKey: meKeys.profile() }),
            ]),
    })
}

const useInvalidateOrders = () => {
    const qc = useQueryClient()
    return () => qc.invalidateQueries({ queryKey: orderKeys.all })
}

export const useCancelOrder = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: cancelOrder, onSuccess: invalidate })
}

export const useConfirmReceived = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: (id: Uuid) => confirmReceived(id), onSuccess: invalidate })
}

export const useRequestReturn = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: requestReturn, onSuccess: invalidate })
}

export const useDisputeReturn = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: disputeReturn, onSuccess: invalidate })
}

export const useWithdrawReturn = () => {
    const invalidate = useInvalidateOrders()
    return useMutation({ mutationFn: (orderId: Uuid) => withdrawReturn(orderId), onSuccess: invalidate })
}

export const useCreateReview = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createReview,
        onSuccess: () =>
            Promise.all([
                qc.invalidateQueries({ queryKey: orderKeys.all }),
                qc.invalidateQueries({ queryKey: catalogKeys.all }),
            ]),
    })
}
