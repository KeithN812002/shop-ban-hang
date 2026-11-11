import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { ProductCard } from '@/components/product/product-card'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { SmartImage } from '@/components/ui/smart-image'
import { useConversations, useMessages, useSendMessage } from '@/features/chat/queries'
import { formatDateTime } from '@/lib/format'

export const Route = createFileRoute('/account/chat')({
    validateSearch: (raw: Record<string, unknown>): { conversationId?: string } => ({
        conversationId: typeof raw.conversationId === 'string' ? raw.conversationId : undefined,
    }),
    component: ChatPage,
})

function ChatPage() {
    const { t, i18n } = useTranslation()
    const { conversationId } = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })
    const conversations = useConversations()
    const messages = useMessages(conversationId)
    const send = useSendMessage()
    const [draft, setDraft] = useState('')
    const listRef = useRef<HTMLDivElement>(null)

    const active = conversations.data?.find(c => c.id === conversationId)
    const ordered = [...(messages.data ?? [])].sort((a, b) => a.createdDate.localeCompare(b.createdDate))

    useEffect(() => {
        const list = listRef.current
        if (list) list.scrollTop = list.scrollHeight
    }, [ordered.length, conversationId])

    const submit = (event: FormEvent) => {
        event.preventDefault()
        const content = draft.trim()
        if (!content || !conversationId || send.isPending) return
        send.mutate({ conversationId, content }, { onSuccess: () => setDraft('') })
    }

    return (
        <section aria-label={t('chat.title')} className="grid h-[calc(100dvh-14rem)] min-h-[420px] overflow-hidden rounded-xl bg-white md:grid-cols-[280px_1fr]">
            <div className={cn('flex min-h-0 flex-col border-r', conversationId && 'hidden md:flex')}>
                <h1 className="border-b px-4 py-3 font-semibold text-gray-900">{t('chat.title')}</h1>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {conversations.isLoading && <Skeleton className="m-3 h-16" />}
                    {conversations.isError && <ErrorState onRetry={() => void conversations.refetch()} />}
                    {conversations.data?.length === 0 && <EmptyState title={t('chat.noConversations')} description={t('chat.noConversationsHint')} />}
                    <ul>
                        {conversations.data?.map(conversation => (
                            <li key={conversation.id}>
                                <button
                                    type="button"
                                    onClick={() => void navigate({ search: { conversationId: conversation.id } })}
                                    aria-current={conversation.id === conversationId}
                                    className={cn(
                                        'flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-gray-50',
                                        conversation.id === conversationId && 'bg-brand-50',
                                    )}
                                >
                                    <SmartImage
                                        src={conversation.storeLogoUrl}
                                        alt={conversation.storeName ?? ''}
                                        className="size-10 shrink-0 rounded-full border object-cover"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {conversation.storeName ?? t('chat.shop')}
                                        </span>
                                        <span className="block truncate text-xs text-gray-500">{conversation.lastMessage}</span>
                                    </span>
                                    {conversation.buyerUnread > 0 && (
                                        <span className="rounded-full bg-brand-500 px-1.5 text-xs text-white">
                                            {conversation.buyerUnread}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={cn('flex min-h-0 flex-col', !conversationId && 'hidden md:flex')}>
                {!conversationId ? (
                    <EmptyState className="m-auto" title={t('chat.selectConversation')} />
                ) : (
                    <>
                        <header className="flex items-center gap-3 border-b px-4 py-3">
                            <button
                                type="button"
                                onClick={() => void navigate({ search: {} })}
                                aria-label={t('common.back')}
                                className="rounded-full p-1 hover:bg-gray-100 md:hidden"
                            >
                                <ArrowLeft className="size-5" />
                            </button>
                            {active ? (
                                <Link to="/store/$id" params={{ id: active.storeId }} className="font-semibold hover:text-brand-600">
                                    {active.storeName ?? t('chat.shop')}
                                </Link>
                            ) : (
                                <span className="font-semibold">{t('chat.shop')}</span>
                            )}
                        </header>

                        <div ref={listRef} aria-live="polite" className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
                            {messages.isLoading && <Skeleton className="h-10 w-1/2" />}
                            {messages.isError && <ErrorState onRetry={() => void messages.refetch()} />}
                            {messages.data && ordered.length === 0 && (
                                <p className="py-8 text-center text-sm text-gray-500">{t('chat.startHint')}</p>
                            )}
                            {ordered.map(message => {
                                const mine = message.senderRole === 'BUYER'
                                return (
                                    <div key={message.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                                        {message.product && (
                                            <div className="mb-1 w-40">
                                                <ProductCard product={message.product} compact />
                                            </div>
                                        )}
                                        <p
                                            className={cn(
                                                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line shadow-sm',
                                                mine ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm bg-white text-gray-800',
                                            )}
                                        >
                                            {message.content}
                                        </p>
                                        <span className="mt-0.5 text-[11px] text-gray-400">
                                            {formatDateTime(message.createdDate, i18n.language)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <form onSubmit={submit} className="flex gap-2 border-t p-3">
                            <input
                                value={draft}
                                onChange={event => setDraft(event.target.value)}
                                placeholder={t('chat.placeholder')}
                                aria-label={t('chat.placeholder')}
                                maxLength={1000}
                                className="h-10 min-w-0 flex-1 rounded-full border border-gray-300 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                            <button
                                type="submit"
                                disabled={!draft.trim() || send.isPending}
                                aria-label={t('chatbot.send')}
                                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                            >
                                <Send className="size-4" />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </section>
    )
}
