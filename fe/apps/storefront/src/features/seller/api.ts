import { apiGet, apiPost } from '@/lib/http'
import type { PageResult, Uuid } from '@/types/api'
import type { OrderStatus } from '@/types/shop'
import type {
    ChartGroupBy,
    DateRangeParams,
    OrderActionRequest,
    RefundRequest,
    ReturnApproveRequest,
    ReturnRejectRequest,
    RevenuePoint,
    SellerConversation,
    SellerMessage,
    SellerOrderDetail,
    SellerOrderRow,
    SellerOrderSearchParams,
    SellerOverview,
    SellerProductDetail,
    SellerProductRequest,
    SellerProductResponse,
    SellerProductSearchParams,
    SellerPromotion,
    SellerPromotionRequest,
    SellerPromotionSearchParams,
    SellerReview,
    SellerReviewSearchParams,
    SellerStore,
    SellerStoreUpdateRequest,
    SellerVoucher,
    SellerVoucherRequest,
    SellerVoucherSearchParams,
    TopProduct,
} from './types'

const SELLER = 'shop/seller'

// ---- store ----
export const getStore = (): Promise<SellerStore> => apiGet<SellerStore>(`${SELLER}/store`)
export const updateStore = (req: SellerStoreUpdateRequest): Promise<void> => apiPost(`${SELLER}/store/update`, req)

// ---- products ----
export const searchProducts = (params: SellerProductSearchParams): Promise<PageResult<SellerProductResponse>> =>
    apiGet<PageResult<SellerProductResponse>>(`${SELLER}/product/search`, { ...params })
export const getProduct = (id: Uuid): Promise<SellerProductDetail> =>
    apiGet<SellerProductDetail>(`${SELLER}/product/${id}`)
export const createProduct = (req: SellerProductRequest): Promise<void> => apiPost(`${SELLER}/product/create`, req)
export const updateProduct = (req: SellerProductRequest): Promise<void> => apiPost(`${SELLER}/product/update`, req)
export const deleteProducts = (ids: Uuid[]): Promise<void> => apiPost(`${SELLER}/product/delete`, { ids })

// ---- orders ----
export const searchOrders = (params: SellerOrderSearchParams): Promise<PageResult<SellerOrderRow>> =>
    apiGet<PageResult<SellerOrderRow>>(`${SELLER}/order/search`, { ...params })
export const getOrder = (id: Uuid): Promise<SellerOrderDetail> => apiGet<SellerOrderDetail>(`${SELLER}/order/${id}`)
export const confirmOrder = (req: OrderActionRequest): Promise<void> => apiPost(`${SELLER}/order/confirm`, req)
export const readyToShipOrder = (req: OrderActionRequest): Promise<void> =>
    apiPost(`${SELLER}/order/ready-to-ship`, req)
export const cancelOrder = (req: OrderActionRequest): Promise<void> => apiPost(`${SELLER}/order/cancel`, req)
export const confirmReturnedOrder = (req: OrderActionRequest): Promise<void> =>
    apiPost(`${SELLER}/order/confirm-returned`, req)

export const approveReturn = (req: ReturnApproveRequest): Promise<void> =>
    apiPost(`${SELLER}/order/return/approve`, req)
export const rejectReturn = (req: ReturnRejectRequest): Promise<void> => apiPost(`${SELLER}/order/return/reject`, req)
export const confirmReturnReceived = (id: Uuid): Promise<void> =>
    apiPost(`${SELLER}/order/return/confirm-received`, { id })
export const markReturnRefunded = (req: RefundRequest): Promise<void> => apiPost(`${SELLER}/order/return/refunded`, req)

/** Counter used by the dashboard "to do" list: reads totalElements of a size-1 page. */
export const countOrders = async (status: OrderStatus): Promise<number> =>
    (await searchOrders({ status, pageNumber: 1, pageSize: 1 })).totalElements

// ---- vouchers ----
export const searchVouchers = (params: SellerVoucherSearchParams): Promise<PageResult<SellerVoucher>> =>
    apiGet<PageResult<SellerVoucher>>(`${SELLER}/voucher/search`, { ...params })
export const createVoucher = (req: SellerVoucherRequest): Promise<void> => apiPost(`${SELLER}/voucher/create`, req)
export const updateVoucher = (req: SellerVoucherRequest): Promise<void> => apiPost(`${SELLER}/voucher/update`, req)
export const deleteVoucher = (id: Uuid): Promise<void> => apiPost(`${SELLER}/voucher/delete`, { id })

// ---- promotions ----
export const searchPromotions = (params: SellerPromotionSearchParams): Promise<PageResult<SellerPromotion>> =>
    apiGet<PageResult<SellerPromotion>>(`${SELLER}/promotion/search`, { ...params })
export const getPromotion = (id: Uuid): Promise<SellerPromotion> => apiGet<SellerPromotion>(`${SELLER}/promotion/${id}`)
export const createPromotion = (req: SellerPromotionRequest): Promise<void> =>
    apiPost(`${SELLER}/promotion/create`, req)
export const updatePromotion = (req: SellerPromotionRequest): Promise<void> =>
    apiPost(`${SELLER}/promotion/update`, req)
export const deletePromotion = (id: Uuid): Promise<void> => apiPost(`${SELLER}/promotion/delete`, { id })

// ---- reviews ----
export const searchReviews = (params: SellerReviewSearchParams): Promise<PageResult<SellerReview>> =>
    apiGet<PageResult<SellerReview>>(`${SELLER}/review/search`, { ...params })
export const replyReview = (req: { id: Uuid; reply: string }): Promise<void> => apiPost(`${SELLER}/review/reply`, req)

// ---- chat ----
export const listConversations = (): Promise<SellerConversation[]> =>
    apiGet<SellerConversation[]>(`${SELLER}/conversation/list`)
export const getMessages = (conversationId: Uuid, after?: string): Promise<SellerMessage[]> =>
    apiGet<SellerMessage[]>(`${SELLER}/conversation/${conversationId}/messages`, { after })
export const sendMessage = (req: { conversationId: Uuid; content: string }): Promise<SellerMessage> =>
    apiPost<SellerMessage>(`${SELLER}/conversation/send`, req)

// ---- stats ----
export const getOverview = (range: DateRangeParams): Promise<SellerOverview> =>
    apiGet<SellerOverview>(`${SELLER}/stats/overview`, { ...range })
export const getRevenueChart = (range: DateRangeParams, groupBy: ChartGroupBy): Promise<RevenuePoint[]> =>
    apiGet<RevenuePoint[]>(`${SELLER}/stats/revenue-chart`, { ...range, groupBy })
export const getTopProducts = (range: DateRangeParams, limit: number): Promise<TopProduct[]> =>
    apiGet<TopProduct[]>(`${SELLER}/stats/top-products`, { ...range, limit })
