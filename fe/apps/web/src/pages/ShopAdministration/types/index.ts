import type { PagingBase } from '@/types/api.types'
import type {
    ActiveStatus,
    DiscountType,
    EntityStatus,
    GroupBy,
    OrderStatus,
    ProductStatus,
    ReturnReasonCode,
    ReturnRequestStatus,
    UserRole,
} from '../constants'

/** Shapes follow `docs/shop-contract.md` section 6.5; fields marked optional are not pinned down by the contract. */

// ---------- shared ----------
export interface ModerationRequest {
    id: string
    reason?: string
}

export interface IdRequest {
    id: string
}

// ---------- category ----------
export interface CategoryNode {
    id: string
    name: string
    slug: string
    icon?: string | null
    imageUrl?: string | null
    parentId?: string | null
    sortOrder?: number
    status?: ActiveStatus
    children: CategoryNode[]
}

export interface CategoryRow {
    id: string
    name: string
    slug: string
    icon?: string | null
    imageUrl?: string | null
    parentId?: string | null
    sortOrder: number
    status: ActiveStatus
    depth: number
    path: string
}

export interface CategoryRequest {
    id?: string
    name: string
    slug: string
    icon?: string | null
    imageUrl?: string | null
    parentId?: string | null
    sortOrder: number
    status: ActiveStatus
}

// ---------- store ----------
export interface StoreResponse {
    id: string
    name: string
    slug?: string
    description?: string | null
    logoUrl?: string | null
    bannerUrl?: string | null
    phone?: string | null
    address?: string | null
    province?: string | null
    ownerUsername?: string | null
    status: EntityStatus
    rejectReason?: string | null
    ratingAvg?: number
    ratingCount?: number
    productCount?: number
    followerCount?: number
    createdDate?: string | null
}

export interface StoreFilterRequest extends PagingBase {
    keyword?: string
    status?: EntityStatus
}

// ---------- shipper ----------
export interface ShipperResponse {
    id: string
    username: string
    fullName: string
    phone?: string | null
    idNumber?: string | null
    vehicleType?: string | null
    vehiclePlate?: string | null
    areaProvince?: string | null
    status: EntityStatus
    rejectReason?: string | null
    createdDate?: string | null
}

export interface ShipperFilterRequest extends PagingBase {
    keyword?: string
    status?: EntityStatus
}

// ---------- product ----------
export interface ProductResponse {
    id: string
    name: string
    thumbnailUrl?: string | null
    price: number
    originalPrice?: number | null
    stock?: number
    soldCount?: number
    status: ProductStatus
    banReason?: string | null
    storeId?: string
    storeName?: string | null
    categoryId?: string
    categoryName?: string | null
    createdDate?: string | null
}

export interface ProductVariant {
    id: string
    name: string
    price: number
    stock: number
    sku?: string | null
}

export interface ProductDetailResponse extends ProductResponse {
    description?: string | null
    images?: string[]
    variants?: ProductVariant[]
    tags?: string[] | string | null
    arType?: string | null
    viewCount?: number
    ratingAvg?: number
    ratingCount?: number
}

export interface ProductFilterRequest extends PagingBase {
    keyword?: string
    storeId?: string
    categoryId?: string
    status?: ProductStatus
}

// ---------- order ----------
export interface OrderResponse {
    id: string
    code: string
    store?: { id: string; name: string } | null
    buyerUsername?: string | null
    status: OrderStatus
    paymentMethod?: string
    paymentStatus?: 'UNPAID' | 'PAID'
    /** Status of the buyer return request, when the list rows carry it. */
    returnStatus?: ReturnRequestStatus | null
    total: number
    itemCount?: number
    createdDate?: string | null
}

export interface OrderItem {
    id: string
    productId?: string
    productName: string
    variantName?: string | null
    imageUrl?: string | null
    price: number
    quantity: number
}

export interface OrderHistoryEntry {
    id: string
    action: string
    statusBefore?: OrderStatus | null
    statusAfter?: OrderStatus | null
    actor?: string | null
    source?: 'BUYER' | 'SELLER' | 'SHIPPER' | 'ADMIN' | 'SYSTEM' | null
    note?: string | null
    createdDate?: string | null
}

/** Buyer return/refund request (contract section 12.3). */
export interface ReturnRequestResponse {
    id: string
    reasonCode: ReturnReasonCode
    description?: string | null
    imageUrls: string[]
    bankName?: string | null
    bankAccountNo?: string | null
    bankAccountName?: string | null
    refundAmount: number
    status: ReturnRequestStatus
    sellerNote?: string | null
    disputeReason?: string | null
    adminNote?: string | null
    refundProofUrl?: string | null
    refundNote?: string | null
    requestedAt?: string | null
    respondedAt?: string | null
    disputedAt?: string | null
    resolvedAt?: string | null
    refundedAt?: string | null
    responseDeadline?: string | null
    disputeDeadline?: string | null
}

export interface ResolveReturnRequest {
    id: string
    approve: boolean
    note: string
}

export interface RefundRequest {
    id: string
    proofImageUrl?: string
    note?: string
}

export interface OrderDetailResponse extends OrderResponse {
    storeName?: string | null
    buyerName?: string | null
    receiverName?: string | null
    receiverPhone?: string | null
    shippingAddress?: string | null
    province?: string | null
    subtotal?: number
    shippingFee?: number
    storeDiscount?: number
    platformDiscount?: number
    platformFee?: number
    sellerIncome?: number
    shipperFee?: number
    note?: string | null
    cancelReason?: string | null
    cancelledBy?: string | null
    shipperName?: string | null
    shipperPhone?: string | null
    failedAttempts?: number
    confirmedAt?: string | null
    shippedAt?: string | null
    deliveredAt?: string | null
    completedAt?: string | null
    cancelledAt?: string | null
    refundedAt?: string | null
    returnShipperUsername?: string | null
    returnRequest?: ReturnRequestResponse | null
    items: OrderItem[]
    history: OrderHistoryEntry[]
}

export interface OrderFilterRequest extends PagingBase {
    status?: OrderStatus
    /** Return request status, e.g. `DISPUTED` to list the disputes. */
    returnStatus?: ReturnRequestStatus
    keyword?: string
    storeId?: string
    fromDate?: string
    toDate?: string
}

// ---------- voucher ----------
export interface VoucherResponse {
    id: string
    code: string
    name: string
    discountType: DiscountType
    discountValue: number
    maxDiscount?: number | null
    minOrderValue?: number | null
    startAt: string
    endAt: string
    usageLimit?: number | null
    usedCount?: number
    perUserLimit?: number | null
    status: ActiveStatus
}

export interface VoucherRequest {
    id?: string
    code: string
    name: string
    discountType: DiscountType
    discountValue: number
    maxDiscount?: number | null
    minOrderValue?: number | null
    startAt: string
    endAt: string
    usageLimit?: number | null
    perUserLimit?: number | null
    status: ActiveStatus
}

export interface VoucherFilterRequest extends PagingBase {
    keyword?: string
    status?: ActiveStatus
}

// ---------- account ----------
export interface AccountResponse {
    /** Id of the core external user (`sa/external-user`); used for lock / unlock. */
    userId: string
    username: string
    fullName?: string | null
    email?: string | null
    phone?: string | null
    roles?: UserRole[]
    status: ActiveStatus
    orderCount?: number
    totalSpent?: number
    storeId?: string | null
    storeName?: string | null
    storeStatus?: EntityStatus | null
    shipperId?: string | null
    shipperStatus?: EntityStatus | null
    createdDate?: string | null
}

/** Account list row; `id` mirrors `userId` so the grid and workflow helpers can key on `id`. */
export interface AccountRow extends AccountResponse {
    id: string
}

export interface AccountFilterRequest extends PagingBase {
    keyword?: string
    role?: UserRole
    status?: ActiveStatus
}

// ---------- stats ----------
export interface StatsRangeRequest {
    fromDate: string
    toDate: string
}

export interface StatsOverview {
    gmv: number
    platformRevenue: number
    completedOrders: number
    cancelledOrders: number
    newUsers: number
    activeStores: number
    activeShippers: number
    pendingStores: number
    pendingShippers: number
    ordersByStatus: Partial<Record<OrderStatus, number>>
}

export interface RevenuePoint {
    period: string
    gmv: number
    platformRevenue: number
    orders: number
}

export interface TopStore {
    storeId: string
    name: string
    logoUrl?: string | null
    orders?: number
    gmv?: number
}

export interface TopProduct {
    productId: string
    name: string
    thumbnailUrl?: string | null
    quantity?: number
    revenue?: number
}

export interface TopCategory {
    categoryId: string
    name: string
    quantity?: number
    revenue?: number
}

export interface RevenueChartRequest extends StatsRangeRequest {
    groupBy: GroupBy
}

export interface TopRequest extends StatsRangeRequest {
    limit: number
}
