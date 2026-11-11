import type { ParseKeys } from 'i18next'

/** Domain enums and display metadata for the shop admin module. Kept out of `src/constants` so the core stays domain-agnostic. */

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusMeta {
    label: ParseKeys
    tone: BadgeTone
}

export const ENTITY_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'] as const
export type EntityStatus = (typeof ENTITY_STATUSES)[number]

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'HIDDEN', 'BANNED'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const ORDER_STATUSES = [
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
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_SHIPPING',
    'RETURN_RECEIVED',
    'REFUNDED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Buyer return request lifecycle (`shop_return_request.status`, contract section 12). */
export const RETURN_REQUEST_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'DISPUTED', 'CANCELLED', 'CLOSED'] as const
export type ReturnRequestStatus = (typeof RETURN_REQUEST_STATUSES)[number]

export const RETURN_REASON_CODES = ['DAMAGED', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'MISSING_PARTS', 'OTHER'] as const
export type ReturnReasonCode = (typeof RETURN_REASON_CODES)[number]

/** Value of the `returnStatus` order filter that lists the disputes waiting for an admin decision. */
export const DISPUTED_RETURN_STATUS: ReturnRequestStatus = 'DISPUTED'
/** Admin may record the manual bank refund once the shop has the returned goods. */
export const ADMIN_REFUNDABLE_ORDER_STATUS: OrderStatus = 'RETURN_RECEIVED'

/** Orders an admin may still cancel (lifecycle: PENDING|CONFIRMED -> CANCELLED). */
export const ADMIN_CANCELLABLE_ORDER_STATUSES: readonly OrderStatus[] = ['PENDING', 'CONFIRMED']

export const ACTIVE_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number]

export const USER_ROLES = ['BUYER', 'SELLER', 'SHIPPER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const DISCOUNT_TYPES = ['PERCENT', 'FIXED'] as const
export type DiscountType = (typeof DISCOUNT_TYPES)[number]

export const GROUP_BY_OPTIONS = ['DAY', 'MONTH'] as const
export type GroupBy = (typeof GROUP_BY_OPTIONS)[number]

const ENTITY_STATUS_META: Record<EntityStatus, StatusMeta> = {
    PENDING: { label: 'shopAdmin.status.entity.PENDING', tone: 'warning' },
    ACTIVE: { label: 'shopAdmin.status.entity.ACTIVE', tone: 'success' },
    REJECTED: { label: 'shopAdmin.status.entity.REJECTED', tone: 'danger' },
    SUSPENDED: { label: 'shopAdmin.status.entity.SUSPENDED', tone: 'neutral' },
}

const PRODUCT_STATUS_META: Record<ProductStatus, StatusMeta> = {
    DRAFT: { label: 'shopAdmin.status.product.DRAFT', tone: 'neutral' },
    ACTIVE: { label: 'shopAdmin.status.product.ACTIVE', tone: 'success' },
    HIDDEN: { label: 'shopAdmin.status.product.HIDDEN', tone: 'info' },
    BANNED: { label: 'shopAdmin.status.product.BANNED', tone: 'danger' },
}

const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
    PENDING: { label: 'shopAdmin.status.order.PENDING', tone: 'warning' },
    CONFIRMED: { label: 'shopAdmin.status.order.CONFIRMED', tone: 'info' },
    READY_TO_SHIP: { label: 'shopAdmin.status.order.READY_TO_SHIP', tone: 'info' },
    PICKING: { label: 'shopAdmin.status.order.PICKING', tone: 'info' },
    SHIPPING: { label: 'shopAdmin.status.order.SHIPPING', tone: 'info' },
    DELIVERED: { label: 'shopAdmin.status.order.DELIVERED', tone: 'success' },
    COMPLETED: { label: 'shopAdmin.status.order.COMPLETED', tone: 'success' },
    CANCELLED: { label: 'shopAdmin.status.order.CANCELLED', tone: 'danger' },
    RETURNING: { label: 'shopAdmin.status.order.RETURNING', tone: 'warning' },
    RETURNED: { label: 'shopAdmin.status.order.RETURNED', tone: 'danger' },
    RETURN_REQUESTED: { label: 'shopAdmin.status.order.RETURN_REQUESTED', tone: 'warning' },
    RETURN_APPROVED: { label: 'shopAdmin.status.order.RETURN_APPROVED', tone: 'info' },
    RETURN_SHIPPING: { label: 'shopAdmin.status.order.RETURN_SHIPPING', tone: 'info' },
    RETURN_RECEIVED: { label: 'shopAdmin.status.order.RETURN_RECEIVED', tone: 'warning' },
    REFUNDED: { label: 'shopAdmin.status.order.REFUNDED', tone: 'success' },
}

const RETURN_REQUEST_STATUS_META: Record<ReturnRequestStatus, StatusMeta> = {
    REQUESTED: { label: 'shopAdmin.status.returnRequest.REQUESTED', tone: 'warning' },
    APPROVED: { label: 'shopAdmin.status.returnRequest.APPROVED', tone: 'success' },
    REJECTED: { label: 'shopAdmin.status.returnRequest.REJECTED', tone: 'danger' },
    DISPUTED: { label: 'shopAdmin.status.returnRequest.DISPUTED', tone: 'warning' },
    CANCELLED: { label: 'shopAdmin.status.returnRequest.CANCELLED', tone: 'neutral' },
    CLOSED: { label: 'shopAdmin.status.returnRequest.CLOSED', tone: 'neutral' },
}

const ACTIVE_STATUS_META: Record<ActiveStatus, StatusMeta> = {
    ACTIVE: { label: 'shopAdmin.status.active.ACTIVE', tone: 'success' },
    INACTIVE: { label: 'shopAdmin.status.active.INACTIVE', tone: 'neutral' },
}

const PAYMENT_STATUS_META: Record<'UNPAID' | 'PAID', StatusMeta> = {
    UNPAID: { label: 'shopAdmin.status.payment.UNPAID', tone: 'warning' },
    PAID: { label: 'shopAdmin.status.payment.PAID', tone: 'success' },
}

const ROLE_META: Record<UserRole, StatusMeta> = {
    BUYER: { label: 'shopAdmin.role.BUYER', tone: 'info' },
    SELLER: { label: 'shopAdmin.role.SELLER', tone: 'success' },
    SHIPPER: { label: 'shopAdmin.role.SHIPPER', tone: 'warning' },
}

export const STATUS_META = {
    entity: ENTITY_STATUS_META,
    product: PRODUCT_STATUS_META,
    order: ORDER_STATUS_META,
    returnRequest: RETURN_REQUEST_STATUS_META,
    active: ACTIVE_STATUS_META,
    payment: PAYMENT_STATUS_META,
    role: ROLE_META,
} as const satisfies Record<string, Record<string, StatusMeta>>

export type StatusDomain = keyof typeof STATUS_META

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, ParseKeys> = {
    PERCENT: 'shopAdmin.discountType.PERCENT',
    FIXED: 'shopAdmin.discountType.FIXED',
}

export const GROUP_BY_LABEL: Record<GroupBy, ParseKeys> = {
    DAY: 'shopAdmin.dashboard.groupBy.DAY',
    MONTH: 'shopAdmin.dashboard.groupBy.MONTH',
}

export interface SelectOption {
    value: string
    label: ParseKeys
}

const toOptions = (meta: Record<string, StatusMeta>): SelectOption[] =>
    Object.entries(meta).map(([value, { label }]) => ({ value, label }))

export const ENTITY_STATUS_OPTIONS = toOptions(ENTITY_STATUS_META)
export const PRODUCT_STATUS_OPTIONS = toOptions(PRODUCT_STATUS_META)
export const ORDER_STATUS_OPTIONS = toOptions(ORDER_STATUS_META)
export const ACTIVE_STATUS_OPTIONS = toOptions(ACTIVE_STATUS_META)
export const ROLE_OPTIONS = toOptions(ROLE_META)
/** Quick-filter tab of the order screen next to "All": disputed return requests. */
export const RETURN_TAB_OPTIONS: SelectOption[] = [
    { value: DISPUTED_RETURN_STATUS, label: 'shopAdmin.order.return.disputeTab' },
]
export const DISCOUNT_TYPE_OPTIONS: SelectOption[] = DISCOUNT_TYPES.map(value => ({
    value,
    label: DISCOUNT_TYPE_LABEL[value],
}))

/** Folder paths seeded by the backend for each screen (menu `pathFolder`). */
export const SHOP_ADMIN_FOLDERS = {
    store: '/ShopAdministration/Store',
    shipper: '/ShopAdministration/Shipper',
} as const

/** Function-permission codes used by `ActionButton` / row actions (seeded as FUNCTION permissions by the backend). */
export const ACTION_CODES = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    approve: 'approve',
    reject: 'reject',
    suspend: 'suspend',
    reactivate: 'reactivate',
    ban: 'ban',
    unban: 'unban',
    cancel: 'cancel',
    confirmReturned: 'confirmReturned',
    resolveReturn: 'resolveReturn',
    markRefunded: 'markRefunded',
    lock: 'lock',
    unlock: 'unlock',
} as const
export type ActionCode = (typeof ACTION_CODES)[keyof typeof ACTION_CODES]

/** Entity statuses (store / shipper) in which each moderation action is available. */
export const MODERATION_ACTION_STATUSES = {
    approve: ['PENDING'],
    reject: ['PENDING'],
    suspend: ['ACTIVE'],
    reactivate: ['SUSPENDED'],
} as const satisfies Record<string, readonly EntityStatus[]>
export type ModerationActionId = keyof typeof MODERATION_ACTION_STATUSES
export const MODERATION_ACTION_IDS = Object.keys(MODERATION_ACTION_STATUSES) as ModerationActionId[]

/** Query key of the sidebar pending-approval badge; store / shipper actions invalidate it. */
export const PENDING_BADGE_QUERY_KEY = ['shop-admin', 'pending-badges'] as const
