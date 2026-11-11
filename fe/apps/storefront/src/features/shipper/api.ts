import { apiGet, apiPost } from '@/lib/http'
import type { PageResult, Uuid } from '@/types/api'
import type { DateRangeParams } from '@/features/seller/types'
import type {
    AvailableOrderParams,
    MyOrderParams,
    ShipperOrderDetail,
    ShipperOrderRow,
    ShipperProfile,
    ShipperStats,
} from './types'

const SHIPPER = 'shop/shipper'

export const getProfile = (): Promise<ShipperProfile> => apiGet<ShipperProfile>(`${SHIPPER}/profile`)

export const searchAvailableOrders = (params: AvailableOrderParams): Promise<PageResult<ShipperOrderRow>> =>
    apiGet<PageResult<ShipperOrderRow>>(`${SHIPPER}/order/available`, { ...params })

export const searchMyOrders = (params: MyOrderParams): Promise<PageResult<ShipperOrderRow>> =>
    apiGet<PageResult<ShipperOrderRow>>(`${SHIPPER}/order/my`, { ...params })

export const getOrder = (id: Uuid): Promise<ShipperOrderDetail> =>
    apiGet<ShipperOrderDetail>(`${SHIPPER}/order/${id}`)

export const acceptOrder = (id: Uuid): Promise<void> => apiPost(`${SHIPPER}/order/accept`, { id })
export const markPickedUp = (id: Uuid): Promise<void> => apiPost(`${SHIPPER}/order/picked-up`, { id })
export const markDelivered = (req: { id: Uuid; proofImageUrl: string }): Promise<void> =>
    apiPost(`${SHIPPER}/order/delivered`, req)
export const markFailed = (req: { id: Uuid; reason: string }): Promise<void> => apiPost(`${SHIPPER}/order/failed`, req)

export const getStats = (range: DateRangeParams): Promise<ShipperStats> =>
    apiGet<ShipperStats>(`${SHIPPER}/stats`, { ...range })
