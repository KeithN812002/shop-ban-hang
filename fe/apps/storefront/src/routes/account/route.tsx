import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Bell, Heart, MapPin, MessageCircle, Package, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { RequireAuth } from '@/components/auth/require-auth'
import { useProfile } from '@/hooks/use-profile'

export const Route = createFileRoute('/account')({
    component: () => (
        <RequireAuth>
            <AccountLayout />
        </RequireAuth>
    ),
})

const NAV = [
    { to: '/account', key: 'profile', icon: User, exact: true },
    { to: '/account/addresses', key: 'addresses', icon: MapPin },
    { to: '/account/orders', key: 'orders', icon: Package },
    { to: '/account/wishlist', key: 'wishlist', icon: Heart },
    { to: '/account/notifications', key: 'notifications', icon: Bell },
    { to: '/account/chat', key: 'chat', icon: MessageCircle },
] as const

function AccountLayout() {
    const { t } = useTranslation()
    const { profile, unreadNotifications } = useProfile()
    return (
        <div className="container-page grid gap-4 py-4 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-32 md:self-start">
                <p className="mb-3 hidden truncate px-2 text-sm font-semibold text-gray-900 md:block">
                    {profile?.fullName || profile?.username}
                </p>
                <nav aria-label={t('account.title')} className="scrollbar-hide flex gap-1 overflow-x-auto md:flex-col">
                    {NAV.map(({ to, key, icon: Icon, ...rest }) => (
                        <Link
                            key={to}
                            to={to}
                            activeOptions={{ exact: 'exact' in rest }}
                            className={cn(
                                'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-gray-700 hover:bg-white hover:text-brand-600',
                            )}
                            activeProps={{ className: 'bg-white font-semibold text-brand-600 shadow-sm' }}
                        >
                            <Icon className="size-4" aria-hidden />
                            {t(`account.menu.${key}`)}
                            {key === 'notifications' && unreadNotifications > 0 && (
                                <span className="ml-auto rounded-full bg-brand-500 px-1.5 text-xs text-white">
                                    {unreadNotifications}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>
            </aside>
            <section className="min-w-0">
                <Outlet />
            </section>
        </div>
    )
}
