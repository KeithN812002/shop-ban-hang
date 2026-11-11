import type { OrderStatus } from '@/types/shop'
import type { ShipperOrderDetail, ShipperOrderRow } from '../types'

type CodSource = Pick<ShipperOrderRow, 'codAmount' | 'paymentStatus' | 'total'> &
    Partial<Pick<ShipperOrderRow, 'jobType' | 'status'>>
type JobSource = Pick<ShipperOrderRow, 'jobType' | 'status'>

/** Statuses only a return job can have for a shipper (the buyer's parcel is on the way back to the shop). */
const RETURN_ONLY_STATUSES: readonly OrderStatus[] = ['RETURN_APPROVED', 'RETURN_SHIPPING']

/** Return pickup job: the pickup is the buyer, the drop-off is the shop, nothing is collected. */
export const isReturnJob = (order: JobSource): boolean =>
    order.jobType === 'RETURN' || (order.jobType === undefined && RETURN_ONLY_STATUSES.includes(order.status))

/** Cash the shipper must collect: explicit server amount, otherwise the total while still unpaid. Never for return jobs. */
export const codAmountOf = (order: CodSource): number => {
    if (order.status !== undefined && isReturnJob({ jobType: order.jobType, status: order.status })) return 0
    return order.codAmount ?? (order.paymentStatus === 'PAID' ? 0 : order.total)
}

export const mapsDirectionsUrl = (address: string): string =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

export const pickupAddressOf = (order: Pick<ShipperOrderRow, 'pickupAddress' | 'storeAddress'>): string =>
    order.pickupAddress || order.storeAddress || ''

export const attemptsOf = (order: Pick<ShipperOrderDetail, 'failedAttempts'>): number => order.failedAttempts ?? 0
