import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meKeys } from '@/features/account/queries'
import { catalogKeys } from '@/features/catalog/queries'
import type { Uuid } from '@/types/api'
import type { OrderStatus } from '@/types/shop'
import {
    approveReturn,
    cancelOrder,
    confirmOrder,
    confirmReturnReceived,
    confirmReturnedOrder,
    countOrders,
    createProduct,
    createPromotion,
    createVoucher,
    deleteProducts,
    deletePromotion,
    deleteVoucher,
    getMessages,
    getOrder,
    getOverview,
    getProduct,
    getPromotion,
    getRevenueChart,
    getStore,
    getTopProducts,
    listConversations,
    markReturnRefunded,
    readyToShipOrder,
    rejectReturn,
    replyReview,
    searchOrders,
    searchProducts,
    searchPromotions,
    searchReviews,
    searchVouchers,
    sendMessage,
    updateProduct,
    updatePromotion,
    updateStore,
    updateVoucher,
} from './api'
import type {
    ChartGroupBy,
    DateRangeParams,
    SellerOrderSearchParams,
    SellerProductRequest,
    SellerProductSearchParams,
    SellerPromotionRequest,
    SellerPromotionSearchParams,
    SellerReviewSearchParams,
    SellerVoucherRequest,
    SellerVoucherSearchParams,
} from './types'

export const CHAT_POLL_MS = 5_000

export const sellerKeys = {
    all: ['seller'] as const,
    store: () => [...sellerKeys.all, 'store'] as const,
    products: () => [...sellerKeys.all, 'products'] as const,
    productList: (params: SellerProductSearchParams) => [...sellerKeys.products(), 'list', params] as const,
    product: (id: Uuid) => [...sellerKeys.products(), 'detail', id] as const,
    orders: () => [...sellerKeys.all, 'orders'] as const,
    orderList: (params: SellerOrderSearchParams) => [...sellerKeys.orders(), 'list', params] as const,
    order: (id: Uuid) => [...sellerKeys.orders(), 'detail', id] as const,
    orderCount: (status: OrderStatus) => [...sellerKeys.orders(), 'count', status] as const,
    vouchers: () => [...sellerKeys.all, 'vouchers'] as const,
    voucherList: (params: SellerVoucherSearchParams) => [...sellerKeys.vouchers(), 'list', params] as const,
    promotions: () => [...sellerKeys.all, 'promotions'] as const,
    promotionList: (params: SellerPromotionSearchParams) => [...sellerKeys.promotions(), 'list', params] as const,
    promotion: (id: Uuid) => [...sellerKeys.promotions(), 'detail', id] as const,
    reviews: () => [...sellerKeys.all, 'reviews'] as const,
    reviewList: (params: SellerReviewSearchParams) => [...sellerKeys.reviews(), 'list', params] as const,
    chat: () => [...sellerKeys.all, 'chat'] as const,
    conversations: () => [...sellerKeys.chat(), 'conversations'] as const,
    messages: (id: Uuid) => [...sellerKeys.chat(), 'messages', id] as const,
    stats: () => [...sellerKeys.all, 'stats'] as const,
    overview: (range: DateRangeParams) => [...sellerKeys.stats(), 'overview', range] as const,
    revenue: (range: DateRangeParams, groupBy: ChartGroupBy) =>
        [...sellerKeys.stats(), 'revenue', range, groupBy] as const,
    topProducts: (range: DateRangeParams, limit: number) =>
        [...sellerKeys.stats(), 'top-products', range, limit] as const,
}

// ---- store ----
export const useSellerStore = () => useQuery({ queryKey: sellerKeys.store(), queryFn: getStore })

export const useUpdateStore = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateStore,
        onSuccess: () =>
            Promise.all([
                qc.invalidateQueries({ queryKey: sellerKeys.store() }),
                qc.invalidateQueries({ queryKey: meKeys.profile() }),
            ]),
    })
}

// ---- products ----
export const useSellerProducts = (params: SellerProductSearchParams) =>
    useQuery({
        queryKey: sellerKeys.productList(params),
        queryFn: () => searchProducts(params),
        placeholderData: keepPreviousData,
    })

export const useSellerProduct = (id: Uuid | undefined) =>
    useQuery({
        queryKey: sellerKeys.product(id ?? 'new'),
        queryFn: () => getProduct(id as Uuid),
        enabled: Boolean(id),
    })

export const useSaveProduct = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (req: SellerProductRequest) => (req.id ? updateProduct(req) : createProduct(req)),
        onSuccess: () =>
            Promise.all([
                qc.invalidateQueries({ queryKey: sellerKeys.products() }),
                qc.invalidateQueries({ queryKey: catalogKeys.all }),
            ]),
    })
}

export const useDeleteProducts = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (ids: Uuid[]) => deleteProducts(ids),
        onSuccess: () =>
            Promise.all([
                qc.invalidateQueries({ queryKey: sellerKeys.products() }),
                qc.invalidateQueries({ queryKey: catalogKeys.all }),
            ]),
    })
}

// ---- orders ----
export const useSellerOrders = (params: SellerOrderSearchParams) =>
    useQuery({
        queryKey: sellerKeys.orderList(params),
        queryFn: () => searchOrders(params),
        placeholderData: keepPreviousData,
    })

export const useSellerOrder = (id: Uuid) => useQuery({ queryKey: sellerKeys.order(id), queryFn: () => getOrder(id) })

export const useOrderCount = (status: OrderStatus) =>
    useQuery({ queryKey: sellerKeys.orderCount(status), queryFn: () => countOrders(status) })

const useInvalidateOrders = () => {
    const qc = useQueryClient()
    return () =>
        Promise.all([
            qc.invalidateQueries({ queryKey: sellerKeys.orders() }),
            qc.invalidateQueries({ queryKey: sellerKeys.stats() }),
        ])
}

export const useConfirmOrder = () => useMutation({ mutationFn: confirmOrder, onSuccess: useInvalidateOrders() })
export const useReadyToShip = () => useMutation({ mutationFn: readyToShipOrder, onSuccess: useInvalidateOrders() })
export const useCancelOrder = () => useMutation({ mutationFn: cancelOrder, onSuccess: useInvalidateOrders() })
export const useConfirmReturned = () =>
    useMutation({ mutationFn: confirmReturnedOrder, onSuccess: useInvalidateOrders() })
export const useApproveReturn = () => useMutation({ mutationFn: approveReturn, onSuccess: useInvalidateOrders() })
export const useRejectReturn = () => useMutation({ mutationFn: rejectReturn, onSuccess: useInvalidateOrders() })
export const useConfirmReturnReceived = () =>
    useMutation({ mutationFn: (id: Uuid) => confirmReturnReceived(id), onSuccess: useInvalidateOrders() })
export const useMarkReturnRefunded = () =>
    useMutation({ mutationFn: markReturnRefunded, onSuccess: useInvalidateOrders() })

// ---- promotions ----
export const useSellerPromotions = (params: SellerPromotionSearchParams) =>
    useQuery({
        queryKey: sellerKeys.promotionList(params),
        queryFn: () => searchPromotions(params),
        placeholderData: keepPreviousData,
    })

export const useSellerPromotion = (id: Uuid | undefined) =>
    useQuery({
        queryKey: sellerKeys.promotion(id ?? 'new'),
        queryFn: () => getPromotion(id as Uuid),
        enabled: Boolean(id),
    })

/** A promotion changes the storefront prices, so cached catalog pages are refreshed too. */
const useInvalidatePromotions = () => {
    const qc = useQueryClient()
    return () =>
        Promise.all([
            qc.invalidateQueries({ queryKey: sellerKeys.promotions() }),
            qc.invalidateQueries({ queryKey: sellerKeys.products() }),
            qc.invalidateQueries({ queryKey: catalogKeys.all }),
        ])
}

export const useSavePromotion = () =>
    useMutation({
        mutationFn: (req: SellerPromotionRequest) => (req.id ? updatePromotion(req) : createPromotion(req)),
        onSuccess: useInvalidatePromotions(),
    })

export const useDeletePromotion = () =>
    useMutation({ mutationFn: (id: Uuid) => deletePromotion(id), onSuccess: useInvalidatePromotions() })

// ---- vouchers ----
export const useSellerVouchers = (params: SellerVoucherSearchParams) =>
    useQuery({
        queryKey: sellerKeys.voucherList(params),
        queryFn: () => searchVouchers(params),
        placeholderData: keepPreviousData,
    })

export const useSaveVoucher = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (req: SellerVoucherRequest) => (req.id ? updateVoucher(req) : createVoucher(req)),
        onSuccess: () => qc.invalidateQueries({ queryKey: sellerKeys.vouchers() }),
    })
}

export const useDeleteVoucher = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: Uuid) => deleteVoucher(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: sellerKeys.vouchers() }),
    })
}

// ---- reviews ----
export const useSellerReviews = (params: SellerReviewSearchParams) =>
    useQuery({
        queryKey: sellerKeys.reviewList(params),
        queryFn: () => searchReviews(params),
        placeholderData: keepPreviousData,
    })

export const useReplyReview = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: replyReview,
        onSuccess: () => qc.invalidateQueries({ queryKey: sellerKeys.reviews() }),
    })
}

// ---- chat (polled while the page is mounted) ----
export const useSellerConversations = () =>
    useQuery({ queryKey: sellerKeys.conversations(), queryFn: listConversations, refetchInterval: CHAT_POLL_MS })

export const useSellerMessages = (conversationId: Uuid | null) => {
    const qc = useQueryClient()
    return useQuery({
        queryKey: sellerKeys.messages(conversationId ?? 'none'),
        queryFn: async () => {
            const messages = await getMessages(conversationId as Uuid)
            // Fetching marks the thread read server-side: refresh the unread badges.
            void qc.invalidateQueries({ queryKey: sellerKeys.conversations() })
            return messages
        },
        enabled: Boolean(conversationId),
        refetchInterval: CHAT_POLL_MS,
    })
}

export const useSendMessage = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: sendMessage,
        onSuccess: (_message, variables) =>
            Promise.all([
                qc.invalidateQueries({ queryKey: sellerKeys.messages(variables.conversationId) }),
                qc.invalidateQueries({ queryKey: sellerKeys.conversations() }),
            ]),
    })
}

// ---- stats ----
export const useOverview = (range: DateRangeParams) =>
    useQuery({ queryKey: sellerKeys.overview(range), queryFn: () => getOverview(range) })

export const useRevenueChart = (range: DateRangeParams, groupBy: ChartGroupBy) =>
    useQuery({ queryKey: sellerKeys.revenue(range, groupBy), queryFn: () => getRevenueChart(range, groupBy) })

export const useTopProducts = (range: DateRangeParams, limit = 5) =>
    useQuery({ queryKey: sellerKeys.topProducts(range, limit), queryFn: () => getTopProducts(range, limit) })
