import { request } from '@/lib/axios'
import { cleanParams, toPaginated } from '@/utils/api.utils'
import type { ApiResponse, PagingBase, PaginatedResponse } from '@/types/api.types'
import type {
    AccountFilterRequest,
    AccountResponse,
    CategoryNode,
    CategoryRequest,
    IdRequest,
    ModerationRequest,
    OrderDetailResponse,
    OrderFilterRequest,
    OrderResponse,
    ProductDetailResponse,
    ProductFilterRequest,
    ProductResponse,
    RefundRequest,
    ResolveReturnRequest,
    RevenueChartRequest,
    RevenuePoint,
    ShipperFilterRequest,
    ShipperResponse,
    StatsOverview,
    StatsRangeRequest,
    StoreFilterRequest,
    StoreResponse,
    TopCategory,
    TopProduct,
    TopRequest,
    TopStore,
    VoucherFilterRequest,
    VoucherRequest,
    VoucherResponse,
} from '../types'

const BASE = 'shop/admin'
const DEFAULT_PAGE_SIZE = 20

/** `PageResult<T>` from the contract: `{ items, totalElements, totalPages, pageNumber, pageSize }`. */
const searchPaged = async <T>(path: string, params: PagingBase & object): Promise<PaginatedResponse<T>> => {
    const res: ApiResponse<{
        items?: T[]
        totalElements?: number
        totalPages?: number
        pageNumber?: number
        pageSize?: number
    }> = await request.get(`${BASE}/${path}`, { params: cleanParams(params) })
    return toPaginated<T>(res.data, params.pageSize ?? DEFAULT_PAGE_SIZE)
}

const getData = async <T>(path: string, params?: object): Promise<T> => {
    const res: ApiResponse<T> = await request.get(`${BASE}/${path}`, {
        params: params ? cleanParams(params) : undefined,
    })
    return res.data
}

const post = async (path: string, body: object): Promise<void> => {
    await request.post(`${BASE}/${path}`, body)
}

// ---------- category ----------
export const fetchCategoryTree = async (): Promise<CategoryNode[]> =>
    (await getData<CategoryNode[]>('category/tree')) ?? []
export const createCategory = (data: CategoryRequest) => post('category/create', data)
export const updateCategory = (data: CategoryRequest) => post('category/update', data)
export const deleteCategory = (id: string) => post('category/delete', { id } satisfies IdRequest)

// ---------- store ----------
export const searchStores = (p: StoreFilterRequest) => searchPaged<StoreResponse>('store/search', p)
export const fetchStoreDetail = async (id: string): Promise<StoreResponse | undefined> =>
    (await getData<StoreResponse | null>(`store/${id}`)) ?? undefined
export const approveStore = (data: ModerationRequest) => post('store/approve', data)
export const rejectStore = (data: ModerationRequest) => post('store/reject', data)
export const suspendStore = (data: ModerationRequest) => post('store/suspend', data)
export const reactivateStore = (data: ModerationRequest) => post('store/reactivate', data)

// ---------- shipper ----------
export const searchShippers = (p: ShipperFilterRequest) => searchPaged<ShipperResponse>('shipper/search', p)
export const approveShipper = (data: ModerationRequest) => post('shipper/approve', data)
export const rejectShipper = (data: ModerationRequest) => post('shipper/reject', data)
export const suspendShipper = (data: ModerationRequest) => post('shipper/suspend', data)
export const reactivateShipper = (data: ModerationRequest) => post('shipper/reactivate', data)

// ---------- product ----------
export const searchProducts = (p: ProductFilterRequest) => searchPaged<ProductResponse>('product/search', p)
export const fetchProductDetail = async (id: string): Promise<ProductDetailResponse | undefined> =>
    (await getData<ProductDetailResponse | null>(`product/${id}`)) ?? undefined
export const banProduct = (data: ModerationRequest) => post('product/ban', data)
export const unbanProduct = (data: ModerationRequest) => post('product/unban', data)

// ---------- order ----------
export const searchOrders = (p: OrderFilterRequest) => searchPaged<OrderResponse>('order/search', p)
export const fetchOrderDetail = async (id: string): Promise<OrderDetailResponse | undefined> => {
    const detail = await getData<OrderDetailResponse | null>(`order/${id}`)
    return detail ? { ...detail, items: detail.items ?? [], history: detail.history ?? [] } : undefined
}
export const cancelOrder = (data: ModerationRequest) => post('order/cancel', data)
export const confirmReturnedOrder = (data: ModerationRequest) => post('order/confirm-returned', data)
export const resolveReturn = (data: ResolveReturnRequest) => post('order/return/resolve', data)
export const markOrderRefunded = (data: RefundRequest) => post('order/return/refunded', data)

// ---------- voucher ----------
export const searchVouchers = (p: VoucherFilterRequest) => searchPaged<VoucherResponse>('voucher/search', p)
export const createVoucher = (data: VoucherRequest) => post('voucher/create', data)
export const updateVoucher = (data: VoucherRequest) => post('voucher/update', data)
export const deleteVoucher = (id: string) => post('voucher/delete', { id } satisfies IdRequest)

// ---------- account ----------
export const searchAccounts = (p: AccountFilterRequest) => searchPaged<AccountResponse>('account/search', p)

// ---------- stats ----------
export const fetchStatsOverview = (p: StatsRangeRequest) => getData<StatsOverview>('stats/overview', p)
export const fetchRevenueChart = async (p: RevenueChartRequest): Promise<RevenuePoint[]> =>
    (await getData<RevenuePoint[]>('stats/revenue-chart', p)) ?? []
export const fetchTopStores = async (p: TopRequest): Promise<TopStore[]> =>
    (await getData<TopStore[]>('stats/top-stores', p)) ?? []
export const fetchTopProducts = async (p: TopRequest): Promise<TopProduct[]> =>
    (await getData<TopProduct[]>('stats/top-products', p)) ?? []
export const fetchTopCategories = async (p: TopRequest): Promise<TopCategory[]> =>
    (await getData<TopCategory[]>('stats/top-categories', p)) ?? []
