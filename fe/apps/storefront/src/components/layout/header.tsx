import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProfile } from '@/hooks/use-profile'
import { AccountMenu } from './account-menu'
import { CategoryMenu } from './category-menu'
import { LanguageSwitch } from './language-switch'
import { Logo } from './logo'
import { NotificationBell } from './notification-bell'
import { SearchBox } from './search-box'

export function Header() {
    const { t } = useTranslation()
    const { isAuthenticated, isSeller, isShipper, cartCount } = useProfile()

    // Not (yet) a seller/shipper -> the same entry points lead to the registration form.
    const sellerTarget = isAuthenticated && !isSeller ? '/seller/register' : '/seller'
    const shipperTarget = isAuthenticated && !isShipper ? '/shipper/register' : '/shipper'

    return (
        <header className="sticky top-0 z-40 bg-linear-to-b from-brand-500 to-brand-600 text-white shadow-md">
            <div className="container-page">
                <nav aria-label={t('header.topNav')} className="flex items-center justify-between py-1.5 text-xs">
                    <div className="flex items-center gap-1">
                        <Link to={sellerTarget} className="rounded px-2 py-1 hover:bg-white/15">
                            {t('header.sellerCenter')}
                        </Link>
                        <span className="h-3 w-px bg-white/40" aria-hidden />
                        <Link to={shipperTarget} className="rounded px-2 py-1 hover:bg-white/15">
                            {t('header.shipper')}
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                        {isAuthenticated && <NotificationBell />}
                        <LanguageSwitch />
                        <AccountMenu />
                    </div>
                </nav>

                <div className="flex items-center gap-2 pt-1 pb-3 sm:gap-4">
                    <Logo light className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
                    <CategoryMenu className="shrink-0" />
                    <SearchBox className="min-w-0 flex-1" />
                    <Link
                        to="/cart"
                        aria-label={t('header.cart')}
                        className="relative flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-white/15"
                    >
                        <ShoppingCart className="size-6" aria-hidden />
                        {cartCount > 0 && (
                            <span className="absolute top-0 right-0 min-w-5 rounded-full bg-white px-1 text-center text-xs leading-5 font-bold text-brand-600">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    )
}
