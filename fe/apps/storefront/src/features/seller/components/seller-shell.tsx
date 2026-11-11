import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import {
    BadgePercent,
    LayoutDashboard,
    MessageSquare,
    PackageSearch,
    ReceiptText,
    Settings,
    Star,
    Ticket,
    type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface NavItem {
    to:
        | '/seller'
        | '/seller/products'
        | '/seller/orders'
        | '/seller/vouchers'
        | '/seller/promotions'
        | '/seller/reviews'
        | '/seller/chat'
        | '/seller/settings'
    key: string
    icon: LucideIcon
    exact?: boolean
}

const NAV: NavItem[] = [
    { to: '/seller', key: 'dashboard', icon: LayoutDashboard, exact: true },
    { to: '/seller/products', key: 'products', icon: PackageSearch },
    { to: '/seller/orders', key: 'orders', icon: ReceiptText },
    { to: '/seller/vouchers', key: 'vouchers', icon: Ticket },
    { to: '/seller/promotions', key: 'promotions', icon: BadgePercent },
    { to: '/seller/reviews', key: 'reviews', icon: Star },
    { to: '/seller/chat', key: 'chat', icon: MessageSquare },
    { to: '/seller/settings', key: 'settings', icon: Settings },
]

interface SellerShellProps {
    title: string
    actions?: ReactNode
    children: ReactNode
    /** Hide the chrome when printing (packing slip pages render their own printable block). */
    className?: string
}

/**
 * Sidebar layout of the Seller Center (top strip on mobile). Each seller page wraps itself in it so the
 * route-level /seller layout only has to deal with access guarding.
 */
export function SellerShell({ title, actions, children, className }: SellerShellProps) {
    const { t } = useTranslation()
    return (
        <div className="container-page py-4">
            <div className="grid gap-4 md:grid-cols-[13rem_minmax(0,1fr)]">
                <nav aria-label={t('seller.nav.label')} className="print:hidden">
                    <ul className="scrollbar-hide flex gap-1 overflow-x-auto rounded-xl border bg-white p-2 md:flex-col md:overflow-visible">
                        {NAV.map(item => (
                            <li key={item.to} className="shrink-0">
                                <Link
                                    to={item.to}
                                    activeOptions={{ exact: item.exact ?? false }}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-gray-700 hover:bg-gray-100"
                                    activeProps={{ className: 'bg-brand-50 font-semibold text-brand-600 hover:bg-brand-50' }}
                                >
                                    <item.icon className="size-4" aria-hidden />
                                    {t(`seller.nav.${item.key}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <section className={cn('min-w-0 space-y-4', className)}>
                    <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                    </div>
                    {children}
                </section>
            </div>
        </div>
    )
}
