import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { JobType, OrderHistoryEntry, OrderStatus } from '@/types/shop'
import { buildStepperModel } from '../lib/delivery-steps'

interface DeliveryStepperProps {
    status: OrderStatus
    jobType?: JobType
    history?: OrderHistoryEntry[] | null
}

/**
 * Shipper-side progress: Nhận đơn -> Đã lấy hàng -> Đang giao -> Đã giao -> Hoàn tất, the hand-back leg,
 * or (return jobs) Nhận đơn -> Đang gửi trả -> Shop nhận hàng.
 */
export function DeliveryStepper({ status, jobType, history }: DeliveryStepperProps) {
    const { t, i18n } = useTranslation()
    const model = buildStepperModel(status, jobType)
    if (!model) return null
    const { steps, done } = model

    // First transition into each status, oldest first.
    const reachedAt = new Map<OrderStatus, string>()
    for (const entry of [...(history ?? [])].sort((a, b) => a.createdDate.localeCompare(b.createdDate))) {
        if (entry.statusAfter && !reachedAt.has(entry.statusAfter)) reachedAt.set(entry.statusAfter, entry.createdDate)
    }

    return (
        <ol aria-label={t('shipper.stepper.label')} className="flex rounded-xl border bg-white px-2 py-3">
            {steps.map((step, index) => {
                const isDone = index < done
                const isCurrent = index === done
                const at = step.at ? reachedAt.get(step.at) : undefined
                return (
                    <li
                        key={step.key}
                        aria-current={isCurrent ? 'step' : undefined}
                        className="relative flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
                    >
                        {index < steps.length - 1 && (
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute top-3 left-1/2 h-0.5 w-full',
                                    index < done ? 'bg-brand-500' : 'bg-gray-200',
                                )}
                            />
                        )}
                        <span
                            className={cn(
                                'relative z-10 flex size-6 items-center justify-center rounded-full border-2 bg-white text-xs font-semibold',
                                isDone && 'border-brand-500 bg-brand-500 text-white',
                                isCurrent && 'border-brand-500 text-brand-600 ring-4 ring-brand-500/15',
                                !isDone && !isCurrent && 'border-gray-300 text-gray-400',
                            )}
                        >
                            {isDone ? <Check className="size-3.5" aria-hidden /> : index + 1}
                        </span>
                        <span
                            className={cn(
                                'px-0.5 text-[11px] leading-tight',
                                isCurrent ? 'font-semibold text-brand-600' : isDone ? 'text-gray-800' : 'text-gray-400',
                            )}
                        >
                            {t(`shipper.stepper.${step.key}`)}
                        </span>
                        {at && (
                            <span className="text-[10px] leading-tight text-gray-500">
                                {formatDateTime(at, i18n.language)}
                            </span>
                        )}
                    </li>
                )
            })}
        </ol>
    )
}
