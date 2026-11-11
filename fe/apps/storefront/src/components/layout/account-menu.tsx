import { Link } from '@tanstack/react-router'
import { ChevronDown, Heart, LogOut, MessageCircle, Package, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePopover } from '@/hooks/use-popover'
import { useProfile } from '@/hooks/use-profile'
import { useAuth } from '@/providers/auth-provider'

const itemClass = 'flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600'

export function AccountMenu() {
    const { t } = useTranslation()
    const { isAuthenticated, login, logout } = useAuth()
    const { profile } = useProfile()
    const { open, toggle, close, ref } = usePopover()

    if (!isAuthenticated) {
        return (
            <div className="flex items-center gap-1">
                <Link to="/register" className="rounded px-2 py-1 hover:bg-white/15">
                    {t('header.register')}
                </Link>
                <span className="h-3 w-px bg-white/40" aria-hidden />
                <button type="button" onClick={() => login(window.location.pathname + window.location.search)} className="rounded px-2 py-1 hover:bg-white/15">
                    {t('header.login')}
                </button>
            </div>
        )
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="true"
                className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-white/15"
            >
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">
                    {(profile?.fullName || profile?.username || '?').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-32 truncate sm:inline">{profile?.fullName || profile?.username}</span>
                <ChevronDown className="size-3" aria-hidden />
            </button>
            {open && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border bg-white py-1 shadow-xl animate-fade-in">
                    <Link to="/account" onClick={close} className={itemClass}>
                        <User className="size-4" aria-hidden />
                        {t('account.menu.profile')}
                    </Link>
                    <Link to="/account/orders" onClick={close} className={itemClass}>
                        <Package className="size-4" aria-hidden />
                        {t('account.menu.orders')}
                    </Link>
                    <Link to="/account/wishlist" onClick={close} className={itemClass}>
                        <Heart className="size-4" aria-hidden />
                        {t('account.menu.wishlist')}
                    </Link>
                    <Link to="/account/chat" onClick={close} className={itemClass}>
                        <MessageCircle className="size-4" aria-hidden />
                        {t('account.menu.chat')}
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            close()
                            void logout()
                        }}
                        className={`${itemClass} w-full border-t`}
                    >
                        <LogOut className="size-4" aria-hidden />
                        {t('header.logout')}
                    </button>
                </div>
            )}
        </div>
    )
}
