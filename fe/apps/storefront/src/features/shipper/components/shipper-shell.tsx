import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Bike, ClipboardList, PackageSearch, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface TabItem {
    to: '/shipper' | '/shipper/orders' | '/shipper/earnings' | '/shipper/profile'
    key: string
    icon: LucideIcon
    exact?: boolean
}

const TABS: TabItem[] = [
    { to: '/shipper', key: 'available', icon: PackageSearch, exact: true },
    { to: '/shipper/orders', key: 'orders', icon: ClipboardList },
    { to: '/shipper/earnings', key: 'earnings', icon: Wallet },
    { to: '/shipper/profile', key: 'profile', icon: UserRound },
]

interface ShipperShellProps {
    title: string
    /** Optional back control rendered before the title (detail pages). */
    leading?: ReactNode
    children: ReactNode
}

/** Mobile-first frame of the shipper area: title bar + fixed bottom tab bar. */
export function ShipperShell({ title, leading, children }: ShipperShellProps) {
    const { t } = useTranslation()
    return (
        <div className="mx-auto w-full max-w-2xl px-3 pt-3 pb-24 sm:px-4">
            <div className="mb-3 flex items-center gap-2">
                {leading}
                <Bike className="size-5 text-brand-500" aria-hidden />
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            </div>
            <div className="space-y-3">{children}</div>

            <nav
                aria-label={t('shipper.nav.label')}
                className="fixed inset-x-0 bottom-0 z-30 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgb(0_0_0/0.06)]"
            >
                <ul className="mx-auto grid max-w-2xl grid-cols-4">
                    {TABS.map(tab => (
                        <li key={tab.to}>
                            <Link
                                to={tab.to}
                                activeOptions={{ exact: tab.exact ?? false }}
                                className="flex flex-col items-center gap-0.5 py-2 text-xs text-gray-500"
                                activeProps={{ className: 'text-brand-600 font-semibold' }}
                            >
                                <tab.icon className="size-5" aria-hidden />
                                {t(`shipper.nav.${tab.key}`)}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}
