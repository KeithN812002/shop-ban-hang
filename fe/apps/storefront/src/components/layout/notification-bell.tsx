import { Link, useRouter } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Spinner } from '@/components/ui/feedback'
import { useMarkNotificationsRead, useNotificationPreview } from '@/features/account/queries'
import { usePopover } from '@/hooks/use-popover'
import { useProfile } from '@/hooks/use-profile'
import { formatDateTime } from '@/lib/format'
import { sanitizeRedirect } from '@/lib/keycloak'
import type { NotificationResponse } from '@/types/shop'

export function NotificationBell() {
    const { t, i18n } = useTranslation()
    const router = useRouter()
    const { unreadNotifications } = useProfile()
    const { open, toggle, close, ref } = usePopover()
    const preview = useNotificationPreview(open)
    const markRead = useMarkNotificationsRead()

    const openNotification = (item: NotificationResponse) => {
        close()
        if (!item.isRead) markRead.mutate({ ids: [item.id] })
        if (item.link) router.history.push(sanitizeRedirect(item.link))
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label={t('header.notifications')}
                className="relative flex items-center gap-1 rounded px-2 py-1 hover:bg-white/15"
            >
                <Bell className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t('header.notifications')}</span>
                {unreadNotifications > 0 && (
                    <span className="absolute -top-1 left-4 min-w-4 rounded-full bg-amber-400 px-1 text-center text-[10px] leading-4 font-bold text-brand-800">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-lg border bg-white text-gray-800 shadow-2xl animate-fade-in">
                    <div className="flex items-center justify-between border-b px-4 py-2.5">
                        <h2 className="text-sm font-semibold">{t('header.notifications')}</h2>
                        {unreadNotifications > 0 && (
                            <button
                                type="button"
                                onClick={() => markRead.mutate({ all: true })}
                                className="text-xs text-brand-600 hover:underline"
                            >
                                {t('notification.markAllRead')}
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {preview.isLoading && (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        )}
                        {preview.isError && <p className="p-4 text-sm text-red-600">{t('common.genericError')}</p>}
                        {preview.data?.items.length === 0 && (
                            <p className="p-6 text-center text-sm text-gray-500">{t('notification.empty')}</p>
                        )}
                        {preview.data?.items.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openNotification(item)}
                                className={cn(
                                    'block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-gray-50',
                                    !item.isRead && 'bg-brand-50/60',
                                )}
                            >
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="line-clamp-2 text-xs text-gray-600">{item.content}</p>
                                <p className="mt-1 text-[11px] text-gray-400">
                                    {formatDateTime(item.createdDate, i18n.language)}
                                </p>
                            </button>
                        ))}
                    </div>
                    <Link
                        to="/account/notifications"
                        onClick={close}
                        className="block border-t py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-gray-50"
                    >
                        {t('notification.viewAll')}
                    </Link>
                </div>
            )}
        </div>
    )
}
