import { apiGet, apiPost } from '@/lib/http'
import type { Uuid } from '@/types/api'
import type { ConversationResponse, MessageResponse } from '@/types/shop'

const ME = 'shop/me'

export const listConversations = (): Promise<ConversationResponse[]> =>
    apiGet<ConversationResponse[]>(`${ME}/conversation/list`)

/** Marks the conversation read on the server side. */
export const getMessages = (conversationId: Uuid, after?: string): Promise<MessageResponse[]> =>
    apiGet<MessageResponse[]>(`${ME}/conversation/${conversationId}/messages`, { after })

export const startConversation = (storeId: Uuid): Promise<ConversationResponse> =>
    apiPost<ConversationResponse>(`${ME}/conversation/start`, { storeId })

export const sendMessage = (req: { conversationId: Uuid; content: string; productId?: Uuid }): Promise<MessageResponse> =>
    apiPost<MessageResponse>(`${ME}/conversation/send`, req)
