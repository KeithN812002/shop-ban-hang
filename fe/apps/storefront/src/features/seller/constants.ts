import { RETURN_ORDER_STATUSES, type ArType, type OrderStatus } from '@/types/shop'
import type { EditableProductStatus, SellerProductStatus } from './types'

export const PAGE_SIZE = 10

export const AR_TYPES: ArType[] = [
    'NONE',
    'FACE_GLASSES',
    'FACE_HAT',
    'FACE_JEWELRY',
    'BODY_TOP',
    'BODY_BOTTOM',
    'OBJECT',
]

export const PRODUCT_STATUS_TABS: Array<SellerProductStatus | 'ALL'> = ['ALL', 'ACTIVE', 'DRAFT', 'HIDDEN', 'BANNED']
export const EDITABLE_PRODUCT_STATUSES: EditableProductStatus[] = ['DRAFT', 'ACTIVE', 'HIDDEN']

/** Order list filter: one status, or the pseudo filter grouping every return/refund status. */
export type OrderFilter = OrderStatus | 'RETURNS'

export const ORDER_TABS: Array<OrderFilter | 'ALL'> = [
    'ALL',
    'PENDING',
    'CONFIRMED',
    'READY_TO_SHIP',
    'PICKING',
    'SHIPPING',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'RETURNING',
    'RETURNED',
    'RETURNS',
]

export const ORDER_FILTERS: OrderFilter[] = ORDER_TABS.filter((tab): tab is OrderFilter => tab !== 'ALL')

/** `status` query value of GET /order/search for a filter (the API takes a comma-separated list). */
export const statusParamOf = (filter: OrderFilter | undefined): string | undefined =>
    filter === 'RETURNS' ? RETURN_ORDER_STATUSES.join(',') : filter

export const MAX_PRODUCT_IMAGES = 9
export const MAX_AR_OVERLAY_BYTES = 5 * 1024 * 1024
