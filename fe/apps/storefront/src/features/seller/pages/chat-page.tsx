import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowLeft, Send, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback'
import { Textarea } from '@/components/ui/form-controls'
import { formatDateTime } from '@/lib/format'
import type { Uuid } from '@/types/api'
import { SellerShell } from '../components/seller-shell'
import { useSellerConversations, useSellerMessages, useSendMessage } from '../queries'
import type { SellerConversation } from '../types'

const MAX_MESSAGE = 2000

const conversationName = (conversation: SellerConversation, fallback: string): string =>
    conversation.buyerName || conversation.buyerUsername || fallback

function MessagePane({ conversation, onBack }: { conversation: SellerConversation; onBack: () => void }) {
    const { t } = useTranslation()
    const messages = useSellerMessages(conversation.id)
    const send = useSendMessage()
    const [draft, setDraft] = useState('')
    const endRef = useRef<HTMLDivElement>(null)
    const count = messages.data?.length ?? 0

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' })
    }, [count, conversation.id])

    const submit = () => {
        const content = draft.trim()
        if (!content || send.isPending) return
        send.mutate(
            { conversationId: conversation.id, content },
            // Keep the draft on failure (the error is toasted by the mutation cache).
            { onSuccess: () => setDraft('') },
        )
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        submit()
    }
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-2 border-b px-3 py-2">
                <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('seller.common.back')} onClick={onBack}>
                    <ArrowLeft />
                </Button>
                <UserRound className="size-5 text-gray-400" aria-hidden />
                <p className="truncate font-semibold text-gray-900">
                    {conversationName(conversation, t('seller.chat.buyer'))}
                </p>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3" aria-live="polite">
                {messages.isLoading && (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                )}
                {messages.isError && <ErrorState onRetry={() => void messages.refetch()} />}
                {messages.data?.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500">{t('seller.chat.noMessages')}</p>
                )}
                {messages.data?.map(message => {
                    const mine = message.senderRole === 'SELLER'
                    return (
                        <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                            <div
                                className={cn(
                                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                                    mine ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm border bg-white text-gray-800',
                                )}
                            >
                                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                                <p className={cn('mt-0.5 text-[10px]', mine ? 'text-white/70' : 'text-gray-400')}>
                                    {formatDateTime(message.createdDate)}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t p-3">
                <Textarea
                    rows={1}
                    className="max-h-32 min-h-10 flex-1 resize-none"
                    value={draft}
                    maxLength={MAX_MESSAGE}
                    placeholder={t('seller.chat.placeholder')}
                    aria-label={t('seller.chat.placeholder')}
                    onChange={event => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <Button type="submit" icon={<Send />} loading={send.isPending} disabled={draft.trim().length === 0}>
                    {t('seller.chat.send')}
                </Button>
            </form>
        </div>
    )
}

export function ChatPage() {
    const { t } = useTranslation()
    const conversations = useSellerConversations()
    const [selectedId, setSelectedId] = useState<Uuid | null>(null)
    const list = conversations.data ?? []
    const selected = list.find(item => item.id === selectedId) ?? null

    return (
        <SellerShell title={t('seller.chat.title')}>
            <div className="grid h-[70vh] min-h-[420px] overflow-hidden rounded-xl border bg-white md:grid-cols-[18rem_minmax(0,1fr)]">
                <aside className={cn('min-h-0 overflow-y-auto border-r', selected && 'hidden md:block')}>
                    {conversations.isLoading && (
                        <div className="space-y-2 p-3">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    )}
                    {conversations.isError && <ErrorState onRetry={() => void conversations.refetch()} />}
                    {conversations.data && list.length === 0 && <EmptyState title={t('seller.chat.empty')} />}
                    <ul>
                        {list.map(conversation => (
                            <li key={conversation.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(conversation.id)}
                                    aria-current={conversation.id === selectedId || undefined}
                                    className={cn(
                                        'flex w-full items-center gap-3 border-b px-3 py-3 text-left hover:bg-gray-50',
                                        conversation.id === selectedId && 'bg-brand-50',
                                    )}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                        <UserRound className="size-5" aria-hidden />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'truncate text-sm',
                                                    conversation.sellerUnread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800',
                                                )}
                                            >
                                                {conversationName(conversation, t('seller.chat.buyer'))}
                                            </span>
                                            {conversation.sellerUnread > 0 && (
                                                <span
                                                    className="min-w-5 shrink-0 rounded-full bg-brand-500 px-1.5 text-center text-xs font-semibold text-white"
                                                    aria-label={t('seller.chat.unread', { count: conversation.sellerUnread })}
                                                >
                                                    {conversation.sellerUnread > 99 ? '99+' : conversation.sellerUnread}
                                                </span>
                                            )}
                                        </span>
                                        <span className="block truncate text-xs text-gray-500">{conversation.lastMessage}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className={cn('min-h-0', !selected && 'hidden md:block')}>
                    {selected ? (
                        <MessagePane key={selected.id} conversation={selected} onBack={() => setSelectedId(null)} />
                    ) : (
                        <EmptyState title={t('seller.chat.selectPrompt')} className="h-full" />
                    )}
                </div>
            </div>
        </SellerShell>
    )
}
