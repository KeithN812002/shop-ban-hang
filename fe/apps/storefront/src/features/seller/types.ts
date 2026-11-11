// Seller Center DTOs. Shapes follow docs/shop-contract.md §6.3; fields the contract leaves implicit are optional.
import type { Uuid } from '@/types/api'
import type {
    ArType,
    DiscountType,
    OrderDetailResponse,
    OrderResponse,
    OrderStatus,
    RegistrationStatus,
    ReviewResponse,
    StoreResponse,
} from '@/types/shop'

export type SellerProductStatus = 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'BANNED'
/** Statuses a seller may set (BANNED is admin-only). */
export type EditableProductStatus = Exclude<SellerProductStatus, 'BANNED'>

export interface SellerProductSearchParams {
    keyword?: string
    status?: SellerProductStatus
    categoryId?: Uuid
    pageNumber?: number
    pageSize?: number
}

export interface SellerProductResponse {
    id: Uuid
    name: string
    thumbnailUrl: string | null
    price: number
    originalPrice: number | null
    stock: number
    soldCount?: number
    viewCount?: number
    status: SellerProductStatus
    banReason?: string | null
    categoryId?: Uuid | null
    categoryName?: string | null
    arType?: ArType
}

export interface SellerVariant {
    id?: Uuid
    name: string
    price: number
    stock: number
    sku: string
}

export interface SellerProductDetail {
    id: Uuid
    categoryId: Uuid | null
    name: string
    description: string | null
    price: number
    originalPrice: number | null
    stock: number
    images: string[]
    variants: Array<Omit<SellerVariant, 'sku'> & { sku?: string | null }>
    /** Comma list (DB shape) or array: normalised by the form mapper. */
    tags: string[] | string | null
    status: SellerProductStatus
    banReason?: string | null
    arType: ArType | null
    arOverlayUrl: string | null
    arScale: number | null
    arOffsetY: number | null
}

export interface SellerProductRequest {
    id?: Uuid
    categoryId: Uuid
    name: string
    description: string
    price: number
    originalPrice: number | null
    stock: number
    images: string[]
    variants: SellerVariant[]
    tags: string[]
    status: EditableProductStatus
    arType: ArType
    arOverlayUrl: string | null
    arScale: number
    arOffsetY: number
}

export interface SellerOrderSearchParams {
    /** One status or a comma-separated list. */
    status?: string
    keyword?: string
    fromDate?: string
    toDate?: string
    pageNumber?: number
    pageSize?: number
}

export interface SellerOrderRow extends OrderResponse {
    buyerName?: string | null
    receiverName?: string | null
}

export type SellerOrderDetail = OrderDetailResponse

export interface OrderActionRequest {
    id: Uuid
    reason?: string
}

export interface ReturnApproveRequest {
    id: Uuid
    note?: string
}

export interface ReturnRejectRequest {
    id: Uuid
    reason: string
}

export interface RefundRequest {
    id: Uuid
    proofImageUrl?: string
    note?: string
}

export interface SellerVoucher {
    id: Uuid
    code: string
    name: string
    discountType: DiscountType
    discountValue: number
    maxDiscount: number | null
    minOrderValue: number | null
    startAt: string | null
    endAt: string | null
    usageLimit: number | null
    usedCount?: number
    perUserLimit: number | null
    status: 'ACTIVE' | 'INACTIVE'
}

export interface SellerVoucherRequest {
    id?: Uuid
    code: string
    name: string
    discountType: DiscountType
    discountValue: number
    maxDiscount: number | null
    minOrderValue: number | null
    startAt: string
    endAt: string
    usageLimit: number | null
    perUserLimit: number | null
    status: 'ACTIVE' | 'INACTIVE'
}

export interface SellerVoucherSearchParams {
    keyword?: string
    status?: 'ACTIVE' | 'INACTIVE'
    pageNumber?: number
    pageSize?: number
}

export type PromotionStatus = 'ACTIVE' | 'INACTIVE'
/** Derived server-side from status + time window. */
export type PromotionState = 'UPCOMING' | 'RUNNING' | 'ENDED' | 'INACTIVE'

export const MIN_PROMOTION_PERCENT = 1
export const MAX_PROMOTION_PERCENT = 90
export const MAX_PROMOTION_PRODUCTS = 200

/** Product of a promotion; `effectivePrice` is the server-computed price while the promotion runs. */
export interface PromotionProduct {
    id: Uuid
    name: string
    thumbnailUrl: string | null
    price: number
    effectivePrice?: number
    stock?: number
    status?: SellerProductStatus
}

export interface SellerPromotion {
    id: Uuid
    name: string
    discountPercent: number
    startAt: string
    endAt: string
    status: PromotionStatus
    state: PromotionState
    productCount: number
    /** Only on `GET /promotion/{id}`. */
    products?: PromotionProduct[]
    createdDate?: string
}

export interface SellerPromotionRequest {
    id?: Uuid
    name: string
    discountPercent: number
    startAt: string
    endAt: string
    status: PromotionStatus
    productIds: Uuid[]
}

export interface SellerPromotionSearchParams {
    keyword?: string
    state?: PromotionState
    pageNumber?: number
    pageSize?: number
}

export interface SellerReview extends ReviewResponse {
    productId?: Uuid
    productName?: string | null
    productThumbnailUrl?: string | null
    orderCode?: string | null
    repliedAt?: string | null
}

export interface SellerReviewSearchParams {
    rating?: number
    pageNumber?: number
    pageSize?: number
}

export interface SellerConversation {
    id: Uuid
    buyerUsername?: string | null
    buyerName?: string | null
    lastMessage: string | null
    lastMessageAt: string | null
    sellerUnread: number
}

export interface SellerMessage {
    id: Uuid
    conversationId: Uuid
    senderUsername?: string
    senderRole: 'BUYER' | 'SELLER'
    content: string
    productId?: Uuid | null
    createdDate: string
}

export interface SellerStore extends StoreResponse {
    phone: string | null
    address: string | null
    status?: RegistrationStatus
    rejectReason?: string | null
}

export interface SellerStoreUpdateRequest {
    name: string
    description: string
    logoUrl: string
    bannerUrl: string
    phone: string
    address: string
    province: string
}

export interface DateRangeParams {
    fromDate: string
    toDate: string
}

export interface SellerOverview {
    revenue: number
    orderCount: number
    pendingCount: number
    toShipCount: number
    cancelledCount: number
    productCount: number
    ratingAvg: number
    viewCount: number
}

export type ChartGroupBy = 'DAY' | 'MONTH'

export interface RevenuePoint {
    period: string
    revenue: number
    orders: number
}

export interface TopProduct {
    productId: Uuid
    name: string
    thumbnailUrl: string | null
    quantity: number
    revenue: number
}
