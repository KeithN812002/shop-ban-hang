import { apiGet, apiPost } from '@/lib/http'
import type { Uuid } from '@/types/api'
import type { CartResponse } from '@/types/shop'

const ME = 'shop/me'

export interface CartAddRequest {
    productId: Uuid
    variantId?: Uuid | null
    quantity: number
}

export const getCart = (): Promise<CartResponse> => apiGet<CartResponse>(`${ME}/cart`)
export const addToCart = (req: CartAddRequest): Promise<void> => apiPost(`${ME}/cart/add`, req)
export const updateCartItem = (req: { id: Uuid; quantity?: number; selected?: boolean }): Promise<void> =>
    apiPost(`${ME}/cart/update`, req)
export const deleteCartItems = (ids: Uuid[]): Promise<void> => apiPost(`${ME}/cart/delete`, { ids })
export const buyNow = (req: CartAddRequest): Promise<void> => apiPost(`${ME}/order/buy-now`, req)
