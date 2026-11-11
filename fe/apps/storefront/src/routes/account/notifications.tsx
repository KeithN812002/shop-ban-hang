import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { useMarkNotificationsRead, useNotifications } from '@/features/account/queries'
import { formatDateTime } from '@/lib/format'
import { sanitizeRedirect } from '@/lib/keycloak'
import type { NotificationResponse } from '@/types/shop'

export const Route = createFileRoute('/account/notifications')({ component: NotificationsPage })

function NotificationsPage() {
    const { t, i18n } = useTranslation()
    const router = useRouter()
    const query = useNotifications(20)
    const markRead = useMarkNotificationsRead()
    const items = query.data?.pages.flatMap(page => page.items) ?? []

    const open = (item: NotificationResponse) => {
        if (!item.isRead) markRead.mutate({ ids: [item.id] })
        if (item.link) router.history.push(sanitizeRedirect(item.link))
    }

    return (
        <section className="rounded-xl bg-white" aria-label={t('notification.title')}>
            <div className="flex items-center justify-between border-b px-5 py-4">
                <h1 className="text-lg font-bold text-gray-900">{t('notification.title')}</h1>
                <Button
                    variant="outline"
                    size="sm"
                    icon={<CheckCheck />}
                    loading={markRead.isPending}
                    disabled={items.every(item => item.isRead)}
                    onClick={() => markRead.mutate({ all: true })}
                >
                    {t('notification.markAllRead')}
                </Button>
            </div>

            {query.isLoading && <Skeleton className="m-5 h-40" />}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && <EmptyState title={t('notification.empty')} />}

            <ul className="divide-y">
                {items.map(item => (
                    <li key={item.id}>
                        <button
                            type="button"
                            onClick={() => open(item)}
                            className={cn(
                                'flex w-full gap-3 px-5 py-4 text-left hover:bg-gray-50',
                                !item.isRead && 'bg-brand-50/50',
                            )}
                        >
                            <span
                                className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.isRead ? 'bg-transparent' : 'bg-brand-500')}
                                aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-gray-900">{item.title}</span>
                                <span className="block text-sm text-gray-600">{item.content}</span>
                                <span className="mt-1 block text-xs text-gray-400">
                                    {t(`notification.type.${item.type}`, { defaultValue: item.type })} |{' '}
                                    {formatDateTime(item.createdDate, i18n.language)}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            {query.hasNextPage && (
                <div className="border-t p-4 text-center">
                    <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                        {t('common.loadMore')}
                    </Button>
                </div>
            )}
        </section>
    )
}
