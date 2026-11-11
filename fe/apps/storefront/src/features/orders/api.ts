import { apiGet, apiPost } from '@/lib/http'
import type { PageResult, PagingParams, Uuid } from '@/types/api'
import type {
    OrderCreateRequest,
    OrderCreateResponse,
    OrderDetailResponse,
    OrderPreviewResponse,
    OrderRequestBase,
    OrderResponse,
    ReturnRequestBody,
    ReviewCreateRequest,
    VoucherResponse,
} from '@/types/shop'

const ME = 'shop/me'

export interface OrderSearchParams extends PagingParams {
    /** One status, or a comma-separated list for grouped tabs (see features/orders/constants.ts) */
    status?: string
    keyword?: string
}

export const getAvailableVouchers = (storeId?: Uuid): Promise<VoucherResponse[]> =>
    apiGet<VoucherResponse[]>(`${ME}/voucher/available`, { storeId })

export const previewOrder = (req: OrderRequestBase): Promise<OrderPreviewResponse> =>
    apiPost<OrderPreviewResponse>(`${ME}/order/preview`, req)

export const createOrder = (req: OrderCreateRequest): Promise<OrderCreateResponse> =>
    apiPost<OrderCreateResponse>(`${ME}/order/create`, req)

export const searchOrders = (params: OrderSearchParams): Promise<PageResult<OrderResponse>> =>
    apiGet<PageResult<OrderResponse>>(`${ME}/order/search`, { ...params })

export const getOrder = (id: Uuid): Promise<OrderDetailResponse> => apiGet<OrderDetailResponse>(`${ME}/order/${id}`)

export const cancelOrder = (req: { id: Uuid; reason: string }): Promise<void> => apiPost(`${ME}/order/cancel`, req)

export const confirmReceived = (id: Uuid): Promise<void> => apiPost(`${ME}/order/confirm-received`, { id })

export const createReview = (req: ReviewCreateRequest): Promise<void> => apiPost(`${ME}/review/create`, req)

export const requestReturn = (req: ReturnRequestBody): Promise<void> => apiPost(`${ME}/order/return/request`, req)

export const disputeReturn = (req: { orderId: Uuid; reason: string }): Promise<void> =>
    apiPost(`${ME}/order/return/dispute`, req)

export const withdrawReturn = (orderId: Uuid): Promise<void> => apiPost(`${ME}/order/return/withdraw`, { orderId })
