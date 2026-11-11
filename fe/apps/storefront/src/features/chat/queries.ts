import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { meKeys } from '@/features/account/queries'
import { useAuth } from '@/providers/auth-provider'
import type { Uuid } from '@/types/api'
import { getMessages, listConversations, sendMessage, startConversation } from './api'

export const CHAT_POLL_MS = 5000

export const chatKeys = {
    all: [...meKeys.all, 'chat'] as const,
    conversations: () => [...chatKeys.all, 'conversations'] as const,
    messages: (id: Uuid) => [...chatKeys.all, 'messages', id] as const,
}

/** Conversation list, polled every 5s while the chat page is mounted. */
export const useConversations = () => {
    const { isAuthenticated } = useAuth()
    return useQuery({
        queryKey: chatKeys.conversations(),
        queryFn: listConversations,
        enabled: isAuthenticated,
        refetchInterval: CHAT_POLL_MS,
    })
}

/** Messages of one conversation, polled every 5s (the endpoint also marks them read). */
export const useMessages = (conversationId: Uuid | undefined) =>
    useQuery({
        queryKey: chatKeys.messages(conversationId ?? 'none'),
        queryFn: () => getMessages(conversationId as Uuid),
        enabled: Boolean(conversationId),
        refetchInterval: CHAT_POLL_MS,
    })

export const useSendMessage = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: sendMessage,
        onSuccess: (_message, variables) =>
            Promise.all([
                qc.invalidateQueries({ queryKey: chatKeys.messages(variables.conversationId) }),
                qc.invalidateQueries({ queryKey: chatKeys.conversations() }),
            ]),
    })
}

/** "Chat with shop": opens (or creates) the conversation and lands on the chat page. */
export const useStartChat = () => {
    const router = useRouter()
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (storeId: Uuid) => startConversation(storeId),
        onSuccess: async conversation => {
            await qc.invalidateQueries({ queryKey: chatKeys.conversations() })
            router.history.push(`/account/chat?conversationId=${encodeURIComponent(conversation.id)}`)
        },
    })
}
