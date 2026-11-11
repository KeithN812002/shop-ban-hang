import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCountdown, useCountdown } from '@/hooks/use-countdown'

interface PromotionStripProps {
    name?: string | null
    endAt: string
}

/** Shop-promotion banner of the product page: promotion name + live "ends in" countdown. Hidden once it has ended. */
export function PromotionStrip({ name, endAt }: PromotionStripProps) {
    const { t } = useTranslation()
    const left = useCountdown(endAt)
    if (left === null || left <= 0) return null

    return (
        <div
            role="timer"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-linear-to-r from-brand-500 to-amber-500 px-4 py-2 text-sm text-white"
        >
            <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                <Zap className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{name || t('product.promotion')}</span>
            </span>
            <span className="tabular-nums">{t('product.promotionEndsIn', { time: formatCountdown(left) })}</span>
        </div>
    )
}
