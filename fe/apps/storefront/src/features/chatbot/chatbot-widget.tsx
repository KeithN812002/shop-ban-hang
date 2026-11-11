import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, RotateCcw, Send, Sparkles, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { ProductCard } from '@/components/product/product-card'
import { chatbotChat } from '@/features/catalog/api'
import { getErrorMessage } from '@/lib/http'
import { clearChatbotMessages, loadChatbotMessages, saveChatbotMessages } from '@/lib/storage'
import type { ChatbotMessage, ProductCard as ProductCardData } from '@/types/shop'

/** The contract accepts at most 20 messages per call; we also never keep more than that locally. */
export const MAX_CHATBOT_MESSAGES = 20

interface UiMessage extends ChatbotMessage {
    products?: ProductCardData[]
}

const SUGGESTION_KEYS = ['hot', 'phoneUnder5m', 'giftForGirlfriend', 'onSale'] as const

export const trimHistory = <T,>(messages: T[]): T[] => messages.slice(-MAX_CHATBOT_MESSAGES)

export function ChatbotWidget() {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<UiMessage[]>(() => trimHistory(loadChatbotMessages<UiMessage>()))
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<string | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const mutation = useMutation({
        mutationFn: (history: ChatbotMessage[]) => chatbotChat(history),
        meta: { silent: true },
    })

    useEffect(() => saveChatbotMessages(messages), [messages])

    useEffect(() => {
        const list = listRef.current
        if (list) list.scrollTop = list.scrollHeight
    }, [messages, mutation.isPending, error, open])

    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    const ask = (history: UiMessage[]) => {
        setError(null)
        const payload: ChatbotMessage[] = history.map(({ role, content }) => ({ role, content }))
        mutation.mutate(payload, {
            onSuccess: result => {
                setMessages(current =>
                    trimHistory([
                        ...current,
                        { role: 'assistant', content: result.reply, products: result.products ?? [] },
                    ]),
                )
            },
            onError: err => setError(getErrorMessage(err, t('chatbot.error'))),
        })
    }

    const send = (text: string) => {
        const content = text.trim()
        if (!content || mutation.isPending) return
        const next = trimHistory([...messages, { role: 'user', content } as UiMessage])
        setMessages(next)
        setDraft('')
        ask(next)
    }

    const onSubmit = (event: FormEvent) => {
        event.preventDefault()
        send(draft)
    }

    const retry = () => {
        // Last message is the unanswered user message.
        if (messages.length > 0 && messages[messages.length - 1]?.role === 'user') ask(messages)
        else setError(null)
    }

    const clear = () => {
        setMessages([])
        setError(null)
        clearChatbotMessages()
    }

    return (
        <>
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('chatbot.open')}
                    className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-linear-to-br from-brand-400 to-brand-600 px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
                >
                    <Bot className="size-6" aria-hidden />
                    <span className="hidden text-sm font-semibold sm:inline">{t('chatbot.title')}</span>
                </button>
            )}

            {open && (
                <section
                    role="dialog"
                    aria-label={t('chatbot.title')}
                    className="fixed inset-x-2 bottom-2 z-50 flex h-[min(620px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl animate-slide-up sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
                >
                    <header className="flex items-center gap-3 bg-linear-to-r from-brand-500 to-brand-600 px-4 py-3 text-white">
                        <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
                            <Sparkles className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold">{t('chatbot.title')}</h2>
                            <p className="truncate text-xs text-white/80">{t('chatbot.subtitle')}</p>
                        </div>
                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={clear}
                                aria-label={t('chatbot.clear')}
                                className="rounded-full p-1.5 hover:bg-white/20"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label={t('chatbot.close')}
                            className="rounded-full p-1.5 hover:bg-white/20"
                        >
                            <X className="size-5" />
                        </button>
                    </header>

                    <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3">
                        <Bubble role="assistant">{t('chatbot.welcome')}</Bubble>

                        {messages.map((message, index) => (
                            <div key={index} className="space-y-2">
                                <Bubble role={message.role}>{message.content}</Bubble>
                                {message.products && message.products.length > 0 && (
                                    <ul className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                                        {message.products.map(product => (
                                            <li key={product.id} className="w-36 shrink-0">
                                                <ProductCard product={product} compact />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}

                        {mutation.isPending && (
                            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm w-fit" aria-label={t('chatbot.typing')}>
                                {[0, 1, 2].map(i => (
                                    <span
                                        key={i}
                                        className="size-2 animate-bounce-dot rounded-full bg-brand-400"
                                        style={{ animationDelay: `${i * 0.16}s` }}
                                    />
                                ))}
                            </div>
                        )}

                        {error && (
                            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <span className="flex-1">{error}</span>
                                <button
                                    type="button"
                                    onClick={retry}
                                    className="flex shrink-0 items-center gap-1 font-medium hover:underline"
                                >
                                    <RotateCcw className="size-3.5" aria-hidden />
                                    {t('common.retry')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="scrollbar-hide flex gap-2 overflow-x-auto border-t bg-white px-3 py-2">
                        {SUGGESTION_KEYS.map(key => (
                            <button
                                key={key}
                                type="button"
                                disabled={mutation.isPending}
                                onClick={() => send(t(`chatbot.suggestions.${key}.query`))}
                                className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                            >
                                {t(`chatbot.suggestions.${key}.label`)}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t bg-white p-3">
                        <input
                            ref={inputRef}
                            value={draft}
                            onChange={event => setDraft(event.target.value)}
                            placeholder={t('chatbot.placeholder')}
                            aria-label={t('chatbot.placeholder')}
                            maxLength={500}
                            className="h-10 min-w-0 flex-1 rounded-full border border-gray-300 px-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        <button
                            type="submit"
                            disabled={!draft.trim() || mutation.isPending}
                            aria-label={t('chatbot.send')}
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                            <Send className="size-4" />
                        </button>
                    </form>
                </section>
            )}
        </>
    )
}

function Bubble({ role, children }: { role: ChatbotMessage['role']; children: string }) {
    const mine = role === 'user'
    return (
        <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
            <p
                className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line shadow-sm',
                    mine ? 'rounded-br-sm bg-brand-500 text-white' : 'rounded-bl-sm bg-white text-gray-800',
                )}
            >
                {children}
            </p>
        </div>
    )
}
