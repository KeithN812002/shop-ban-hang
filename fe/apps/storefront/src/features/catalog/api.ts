import { apiGet, apiPost } from '@/lib/http'
import type { PageResult, PagingParams, Uuid } from '@/types/api'
import type {
    CategoryNode,
    ChatbotMessage,
    ChatbotReply,
    HomeResponse,
    ProductCard,
    ProductDetail,
    ProductSearchParams,
    RegisterRequest,
    ReviewResponse,
    ReviewSummary,
    StoreResponse,
} from '@/types/shop'

const PUBLIC = 'shop/public'

export const getHome = (): Promise<HomeResponse> => apiGet<HomeResponse>(`${PUBLIC}/home`)

export const getCategoryTree = (): Promise<CategoryNode[]> => apiGet<CategoryNode[]>(`${PUBLIC}/category/tree`)

export const searchProducts = (params: ProductSearchParams): Promise<PageResult<ProductCard>> =>
    apiGet<PageResult<ProductCard>>(`${PUBLIC}/product/search`, { ...params })

export const suggestProducts = (keyword: string): Promise<string[]> =>
    apiGet<string[]>(`${PUBLIC}/product/suggest`, { keyword })

export const getProduct = async (id: Uuid): Promise<ProductDetail> => {
    const detail = await apiGet<ProductDetail>(`${PUBLIC}/product/${id}`)
    // Collections may be null for products without images / variants / tags.
    return { ...detail, images: detail.images ?? [], variants: detail.variants ?? [], tags: detail.tags ?? [] }
}

export const getRelatedProducts = (id: Uuid): Promise<ProductCard[]> =>
    apiGet<ProductCard[]>(`${PUBLIC}/product/${id}/related`)

export interface ReviewQuery extends PagingParams {
    rating?: number
}

export const getProductReviews = (id: Uuid, params: ReviewQuery): Promise<PageResult<ReviewResponse>> =>
    apiGet<PageResult<ReviewResponse>>(`${PUBLIC}/product/${id}/reviews`, { ...params })

export const getReviewSummary = (id: Uuid): Promise<ReviewSummary> =>
    apiGet<ReviewSummary>(`${PUBLIC}/product/${id}/review-summary`)

export const getStore = (id: Uuid): Promise<StoreResponse> => apiGet<StoreResponse>(`${PUBLIC}/store/${id}`)

export const chatbotChat = (messages: ChatbotMessage[]): Promise<ChatbotReply> =>
    apiPost<ChatbotReply>(`${PUBLIC}/chatbot/chat`, { messages })

export const registerAccount = (req: RegisterRequest): Promise<void> => apiPost(`${PUBLIC}/auth/register`, req)
