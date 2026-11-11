import { RETURN_ORDER_STATUSES, type OrderStatus } from '@/types/shop'

export type OrderTabKey =
    | 'all'
    | 'pending'
    | 'toShip'
    | 'shipping'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'returned'
    | 'refund'

export interface OrderTab {
    key: OrderTabKey
    /** statuses covered by the tab; sent to the API comma-separated */
    statuses: OrderStatus[]
}

export const ORDER_TABS: OrderTab[] = [
    { key: 'all', statuses: [] },
    { key: 'pending', statuses: ['PENDING'] },
    { key: 'toShip', statuses: ['CONFIRMED', 'READY_TO_SHIP', 'PICKING'] },
    { key: 'shipping', statuses: ['SHIPPING', 'RETURNING'] },
    { key: 'delivered', statuses: ['DELIVERED'] },
    { key: 'completed', statuses: ['COMPLETED'] },
    { key: 'cancelled', statuses: ['CANCELLED'] },
    { key: 'returned', statuses: ['RETURNED'] },
    { key: 'refund', statuses: [...RETURN_ORDER_STATUSES] },
]

export const isOrderTabKey = (value: unknown): value is OrderTabKey => ORDER_TABS.some(tab => tab.key === value)

export const statusParamForTab = (key: OrderTabKey): string | undefined => {
    const statuses = ORDER_TABS.find(tab => tab.key === key)?.statuses ?? []
    return statuses.length > 0 ? statuses.join(',') : undefined
}

/** Buyer may cancel only before the seller hands the parcel over. */
export const canBuyerCancel = (status: OrderStatus): boolean => status === 'PENDING' || status === 'CONFIRMED'
