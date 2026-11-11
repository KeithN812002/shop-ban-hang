// Shipper DTOs. Shapes follow docs/shop-contract.md §6.4 + `shop_order`/`shop_shipper` (§4); the contract does not
// spell out the list/detail payloads, so every field beyond the order columns is optional and read defensively.
import type { Uuid } from '@/types/api'
import type { JobType, OrderDetailResponse, OrderStatus, RegistrationStatus } from '@/types/shop'

export const MAX_DELIVERY_ATTEMPTS = 3

export type MyOrderStatus = Extract<
    OrderStatus,
    'PICKING' | 'SHIPPING' | 'RETURNING' | 'DELIVERED' | 'RETURNED' | 'RETURN_SHIPPING'
>

/** Tabs of "my orders", in display order. */
export const MY_ORDER_STATUSES: MyOrderStatus[] = [
    'PICKING',
    'SHIPPING',
    'RETURN_SHIPPING',
    'RETURNING',
    'DELIVERED',
    'RETURNED',
]

export interface ShipperProfile {
    id?: Uuid
    username: string
    fullName: string
    phone: string
    idNumber: string
    vehicleType: string
    vehiclePlate: string
    areaProvince: string
    status: RegistrationStatus
    rejectReason?: string | null
}

/** One row of the available / my-orders lists. */
export interface ShipperOrderRow {
    id: Uuid
    code: string
    status: OrderStatus
    /** RETURN = pick the parcel up at the buyer and bring it back to the shop (contract §12.3). */
    jobType?: JobType
    storeName?: string | null
    /** Store pickup address (field name not fixed by the contract: either one may be present). */
    pickupAddress?: string | null
    storeAddress?: string | null
    receiverName?: string | null
    province?: string | null
    shippingAddress?: string | null
    paymentStatus?: 'UNPAID' | 'PAID'
    total: number
    /** Amount to collect; falls back to `total` while the order is unpaid. */
    codAmount?: number | null
    shippingFee: number
    shipperFee?: number | null
    failedAttempts?: number | null
    itemCount?: number | null
    createdDate?: string
}

export interface ShipperOrderDetail extends OrderDetailResponse {
    jobType?: JobType
    province?: string | null
    failedAttempts?: number | null
    shipperFee?: number | null
    pickupAddress?: string | null
    storeAddress?: string | null
    storePhone?: string | null
    storeProvince?: string | null
    shipperUsername?: string | null
}

/** Filter of the available list: normal deliveries, return pickups, or both. */
export type AvailableJobType = JobType | 'ALL'
export const AVAILABLE_JOB_TYPES: AvailableJobType[] = ['ALL', 'DELIVERY', 'RETURN']

export interface AvailableOrderParams {
    province?: string
    type?: AvailableJobType
    pageNumber?: number
    pageSize?: number
}

/** Statuses that still need an action from the shipper (pick up / deliver / bring a return back). */
export const ACTIVE_ORDER_STATUSES = 'PICKING,SHIPPING,RETURN_SHIPPING'

/** A single status or a comma-separated list (the API accepts a list, e.g. the orders still to handle). */
export type MyOrderStatusFilter = MyOrderStatus | typeof ACTIVE_ORDER_STATUSES | `${MyOrderStatus},${MyOrderStatus}`

export interface MyOrderParams {
    status?: MyOrderStatusFilter
    pageNumber?: number
    pageSize?: number
}

export interface ShipperStatsPoint {
    period: string
    earnings: number
    deliveries: number
}

export interface ShipperStats {
    deliveredCount: number
    failedCount: number
    returnedCount: number
    codCollected: number
    earnings: number
    chart: ShipperStatsPoint[]
}

export type FailureReason = 'RECEIVER_ABSENT' | 'WRONG_ADDRESS' | 'REFUSED' | 'PHONE_UNREACHABLE' | 'OTHER'
