import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import type { OrderStatus } from '@/types/shop'

const tone: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
    READY_TO_SHIP: 'bg-sky-50 text-sky-700 border-sky-200',
    PICKING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SHIPPING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
    RETURNING: 'bg-orange-50 text-orange-700 border-orange-200',
    RETURNED: 'bg-red-50 text-red-700 border-red-200',
    RETURN_REQUESTED: 'bg-orange-50 text-orange-700 border-orange-200',
    RETURN_APPROVED: 'bg-sky-50 text-sky-700 border-sky-200',
    RETURN_SHIPPING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    RETURN_RECEIVED: 'bg-violet-50 text-violet-700 border-violet-200',
    REFUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

/** Status pill backed by the seller namespace so seller/shipper screens never depend on buyer-side keys. */
export function OrderStatusPill({ status, className }: { status: OrderStatus; className?: string }) {
    const { t } = useTranslation()
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                tone[status] ?? tone.PENDING,
                className,
            )}
        >
            {t(`seller.orderStatus.${status}`, { defaultValue: status })}
        </span>
    )
}
