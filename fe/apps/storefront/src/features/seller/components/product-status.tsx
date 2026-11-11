import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import type { SellerProductStatus } from '../types'

const tone: Record<SellerProductStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    HIDDEN: 'bg-amber-50 text-amber-700 border-amber-200',
    BANNED: 'bg-red-50 text-red-700 border-red-200',
}

export function ProductStatusPill({ status }: { status: SellerProductStatus }) {
    const { t } = useTranslation()
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                tone[status] ?? tone.DRAFT,
            )}
        >
            {t(`seller.products.status.${status}`, { defaultValue: status })}
        </span>
    )
}
