import { apiGet, apiPost, apiUpload } from '@/lib/http'
import type { PageResult, PagingParams, Uuid } from '@/types/api'
import type {
    AddressRequest,
    AddressResponse,
    NotificationResponse,
    ProductCard,
    Profile,
    ShipperRegisterRequest,
    StoreRegisterRequest,
} from '@/types/shop'

const ME = 'shop/me'

export const getProfile = (): Promise<Profile> => apiGet<Profile>(`${ME}/profile`)

export const getAddresses = (): Promise<AddressResponse[]> => apiGet<AddressResponse[]>(`${ME}/address`)
export const createAddress = (req: AddressRequest): Promise<void> => apiPost(`${ME}/address/create`, req)
export const updateAddress = (req: AddressRequest): Promise<void> => apiPost(`${ME}/address/update`, req)
export const deleteAddress = (id: Uuid): Promise<void> => apiPost(`${ME}/address/delete`, { id })

export const getWishlist = (): Promise<ProductCard[]> => apiGet<ProductCard[]>(`${ME}/wishlist`)
export const toggleWishlist = (productId: Uuid): Promise<{ liked: boolean }> =>
    apiPost<{ liked: boolean }>(`${ME}/wishlist/toggle`, { productId })

export const searchNotifications = (params: PagingParams): Promise<PageResult<NotificationResponse>> =>
    apiGet<PageResult<NotificationResponse>>(`${ME}/notification/search`, { ...params })
export const markNotificationsRead = (req: { ids?: Uuid[]; all?: boolean }): Promise<void> =>
    apiPost(`${ME}/notification/read`, req)

export const toggleFollowStore = (storeId: Uuid): Promise<{ followed: boolean }> =>
    apiPost<{ followed: boolean }>(`${ME}/store/follow`, { storeId })

/** Image upload (<= 5MB) used by reviews, store/shipper registration and the seller center. */
export const uploadImage = (file: File): Promise<{ url: string }> => apiUpload<{ url: string }>(`${ME}/file/upload`, file)

export const registerStore = (req: StoreRegisterRequest): Promise<void> => apiPost(`${ME}/store/register`, req)
export const registerShipper = (req: ShipperRegisterRequest): Promise<void> =>
    apiPost(`${ME}/shipper/register`, req)
