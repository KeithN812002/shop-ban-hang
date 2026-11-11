// DTOs mirror docs/shop-contract.md. Fields the contract leaves implicit are marked optional.
import type { Uuid } from './api'

export type ArType = 'NONE' | 'FACE_GLASSES' | 'FACE_HAT' | 'FACE_JEWELRY' | 'BODY_TOP' | 'BODY_BOTTOM' | 'OBJECT'

export type RegistrationStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'

export interface CategoryNode {
    id: Uuid
    name: string
    slug: string
    icon?: string | null
    imageUrl?: string | null
    children?: CategoryNode[] | null
}

export interface ProductCard {
    id: Uuid
    name: string
    slug: string
    thumbnailUrl: string | null
    price: number
    originalPrice: number | null
    discountPercent: number | null
    ratingAvg: number
    ratingCount: number
    soldCount: number
    storeId: Uuid
    storeName: string
    province: string | null
    arType: ArType
    /** Set while a shop promotion is running; `price` is then already the discounted price. */
    promotionName?: string | null
    /** `YYYY-MM-DDTHH:mm:ss` */
    promotionEndAt?: string | null
}

export interface StoreResponse {
    id: Uuid
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
    bannerUrl: string | null
    province: string | null
    ratingAvg: number
    ratingCount: number
    productCount: number
    followerCount: number
    createdDate: string
}

export interface ProductVariant {
    id: Uuid
    name: string
    price: number
    stock: number
}

export interface ProductDetail extends ProductCard {
    description: string | null
    stock: number
    categoryId: Uuid | null
    categoryName: string | null
    images: string[]
    variants: ProductVariant[]
    tags: string[]
    arOverlayUrl: string | null
    arScale: number | null
    arOffsetY: number | null
    store: StoreResponse
}

export interface ReviewResponse {
    id: Uuid
    buyerName: string
    rating: number
    comment: string | null
    imageUrls: string[] | string | null
    variantName: string | null
    sellerReply: string | null
    createdDate: string
}

export interface ReviewSummary {
    average: number
    total: number
    counts: Record<string, number>
}

export interface HomeResponse {
    categories: CategoryNode[]
    trending: ProductCard[]
    bestSellers: ProductCard[]
    newArrivals: ProductCard[]
    flashDeals: ProductCard[]
    trendingKeywords: string[]
}

export type ProductSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'popular'

export interface ProductSearchParams {
    keyword?: string
    categoryId?: Uuid
    storeId?: Uuid
    minPrice?: number
    maxPrice?: number
    minRating?: number
    sort?: ProductSort
    pageNumber?: number
    pageSize?: number
}

// ---- chatbot ----
export interface ChatbotMessage {
    role: 'user' | 'assistant'
    content: string
}
export interface ChatbotReply {
    reply: string
    products: ProductCard[]
}

// ---- account ----
export interface Profile {
    username: string
    fullName: string
    email: string
    isSeller: boolean
    storeId: Uuid | null
    storeStatus: RegistrationStatus | null
    isShipper: boolean
    shipperStatus: RegistrationStatus | null
    unreadNotifications: number
    cartCount: number
}

export interface CartStore {
    id: Uuid
    name: string
}
export interface CartItem {
    id: Uuid
    productId: Uuid
    variantId: Uuid | null
    name: string
    variantName: string | null
    imageUrl: string | null
    price: number
    quantity: number
    stock: number
    selected: boolean
    available: boolean
}
export interface CartGroup {
    store: CartStore
    items: CartItem[]
}
export interface CartResponse {
    groups: CartGroup[]
}

export interface AddressRequest {
    id?: Uuid
    receiverName: string
    phone: string
    province: string
    district: string
    ward: string
    detail: string
    isDefault: boolean
}
export interface AddressResponse extends AddressRequest {
    id: Uuid
}

export type DiscountType = 'PERCENT' | 'FIXED'
export interface VoucherResponse {
    id: Uuid
    storeId: Uuid | null
    code: string
    name: string
    discountType: DiscountType
    discountValue: number
    maxDiscount: number | null
    minOrderValue: number | null
    startAt?: string | null
    endAt?: string | null
}

export interface OrderRequestBase {
    addressId: Uuid
    storeVouchers: Record<string, string>
    platformVoucherCode?: string
}
export interface OrderCreateRequest extends OrderRequestBase {
    note: Record<string, string>
}
export interface OrderPreviewItem {
    productId?: Uuid
    variantId?: Uuid | null
    name: string
    variantName?: string | null
    imageUrl?: string | null
    price: number
    quantity: number
}
export interface OrderPreviewStore {
    storeId: Uuid
    storeName: string
    items: OrderPreviewItem[]
    subtotal: number
    shippingFee: number
    storeDiscount: number
}
export interface OrderPreviewResponse {
    orders: OrderPreviewStore[]
    platformDiscount: number
    total: number
}
export interface OrderCreateResponse {
    orderIds: Uuid[]
    codes: string[]
}

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'READY_TO_SHIP'
    | 'PICKING'
    | 'SHIPPING'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'RETURNING'
    | 'RETURNED'
    | 'RETURN_REQUESTED'
    | 'RETURN_APPROVED'
    | 'RETURN_SHIPPING'
    | 'RETURN_RECEIVED'
    | 'REFUNDED'

/** Statuses of the buyer return & refund flow (contract §12). */
export const RETURN_ORDER_STATUSES = [
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_SHIPPING',
    'RETURN_RECEIVED',
    'REFUNDED',
] as const satisfies readonly OrderStatus[]

export const RETURN_REASON_CODES = ['DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'MISSING_PARTS', 'OTHER'] as const
export type ReturnReasonCode = (typeof RETURN_REASON_CODES)[number]

export type ReturnRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'DISPUTED' | 'CANCELLED' | 'CLOSED'

/** Shipper job kind: normal delivery or the pickup of a returned parcel from the buyer. */
export type JobType = 'DELIVERY' | 'RETURN'

export const MAX_RETURN_IMAGES = 6

export interface ReturnRequestResponse {
    id: Uuid
    reasonCode: ReturnReasonCode
    description: string | null
    imageUrls: string[]
    bankName: string | null
    bankAccountNo: string | null
    bankAccountName: string | null
    refundAmount: number
    status: ReturnRequestStatus
    sellerNote: string | null
    disputeReason: string | null
    adminNote: string | null
    refundProofUrl: string | null
    refundNote: string | null
    requestedAt: string
    respondedAt: string | null
    disputedAt: string | null
    resolvedAt: string | null
    refundedAt: string | null
    /** Seller must answer before this moment, otherwise the request is auto-approved. */
    responseDeadline: string | null
    /** Buyer may dispute a rejection until this moment. */
    disputeDeadline: string | null
}

export interface ReturnRequestBody {
    orderId: Uuid
    reasonCode: ReturnReasonCode
    description: string
    imageUrls: string[]
    bankName: string
    bankAccountNo: string
    bankAccountName: string
}

export interface OrderResponse {
    id: Uuid
    code: string
    store: CartStore
    status: OrderStatus
    paymentMethod: string
    paymentStatus: 'UNPAID' | 'PAID'
    total: number
    itemCount: number
    firstItem: { name: string; imageUrl: string | null; variantName: string | null; quantity: number; price: number }
    createdDate: string
}
export interface OrderItemResponse {
    id: Uuid
    productId: Uuid
    variantId: Uuid | null
    productName: string
    variantName: string | null
    imageUrl: string | null
    price: number
    quantity: number
    reviewed: boolean
}
export interface OrderHistoryEntry {
    id?: Uuid
    action: string
    statusBefore: OrderStatus | null
    statusAfter: OrderStatus | null
    actor: string | null
    source: 'BUYER' | 'SELLER' | 'SHIPPER' | 'ADMIN' | 'SYSTEM'
    note: string | null
    createdDate: string
}
export interface OrderDetailResponse {
    id: Uuid
    code: string
    storeId: Uuid
    storeName?: string | null
    status: OrderStatus
    paymentMethod: string
    paymentStatus: 'UNPAID' | 'PAID'
    receiverName: string
    receiverPhone: string
    shippingAddress: string
    subtotal: number
    shippingFee: number
    storeDiscount: number
    platformDiscount: number
    total: number
    note: string | null
    cancelReason: string | null
    cancelledBy: string | null
    deliveryProofUrl: string | null
    createdDate: string
    confirmedAt: string | null
    shippedAt: string | null
    deliveredAt: string | null
    completedAt: string | null
    cancelledAt: string | null
    buyerName?: string | null
    shipperName?: string | null
    shipperPhone?: string | null
    items: OrderItemResponse[]
    history: OrderHistoryEntry[]
    returnRequest?: ReturnRequestResponse | null
    refundedAt?: string | null
    returnShipperUsername?: string | null
    /** delivered_at + return window; only while DELIVERED. */
    returnDeadline?: string | null
    /** Buyer view only. */
    canRequestReturn?: boolean
}

export interface ReviewCreateRequest {
    orderItemId: Uuid
    rating: number
    comment: string
    imageUrls: string[]
}

export type NotificationType = 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'CHAT'
export interface NotificationResponse {
    id: Uuid
    type: NotificationType
    title: string
    content: string
    link: string | null
    isRead: boolean
    createdDate: string
}

export interface ConversationResponse {
    id: Uuid
    storeId: Uuid
    storeName?: string | null
    storeLogoUrl?: string | null
    lastMessage: string | null
    lastMessageAt: string | null
    buyerUnread: number
}
export interface MessageResponse {
    id: Uuid
    conversationId: Uuid
    senderUsername?: string
    senderRole: 'BUYER' | 'SELLER'
    content: string
    productId?: Uuid | null
    product?: ProductCard | null
    createdDate: string
}

export interface StoreRegisterRequest {
    name: string
    description: string
    phone: string
    address: string
    province: string
    logoUrl: string
}
export interface ShipperRegisterRequest {
    fullName: string
    phone: string
    idNumber: string
    vehicleType: string
    vehiclePlate: string
    areaProvince: string
}

export interface RegisterRequest {
    username: string
    email: string
    password: string
    fullName: string
    phone: string
}
