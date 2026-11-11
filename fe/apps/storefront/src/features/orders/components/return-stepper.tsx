import { Check, Pause } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import type { OrderStatus, ReturnRequestStatus } from '@/types/shop'
import { computeReturnSteps } from '../lib/return-flow'

interface ReturnStepperProps {
    orderStatus: OrderStatus
    requestStatus?: ReturnRequestStatus | null
}

/** Gửi yêu cầu → Shop chấp nhận → Đang gửi trả → Shop nhận hàng → Đã hoàn tiền (steps from computeReturnSteps). */
export function ReturnStepper({ orderStatus, requestStatus }: ReturnStepperProps) {
    const { t } = useTranslation()
    const steps = computeReturnSteps(orderStatus, requestStatus)
    if (steps.length === 0) return null

    return (
        <ol aria-label={t('order.return.stepperLabel')} className="flex py-2">
            {steps.map((step, index) => (
                <li
                    key={step.key}
                    aria-current={step.state === 'current' || step.state === 'blocked' ? 'step' : undefined}
                    className="relative flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
                >
                    {index < steps.length - 1 && (
                        <span
                            aria-hidden
                            className={cn(
                                'absolute top-3 left-1/2 h-0.5 w-full',
                                step.state === 'done' ? 'bg-brand-500' : 'bg-gray-200',
                            )}
                        />
                    )}
                    <span
                        className={cn(
                            'relative z-10 flex size-6 items-center justify-center rounded-full border-2 bg-white text-xs font-semibold',
                            step.state === 'done' && 'border-brand-500 bg-brand-500 text-white',
                            step.state === 'current' && 'border-brand-500 text-brand-600 ring-4 ring-brand-500/15',
                            step.state === 'blocked' && 'border-orange-500 bg-orange-50 text-orange-600',
                            step.state === 'todo' && 'border-gray-300 text-gray-400',
                        )}
                    >
                        {step.state === 'done' ? (
                            <Check className="size-3.5" aria-hidden />
                        ) : step.state === 'blocked' ? (
                            <Pause className="size-3" aria-hidden />
                        ) : (
                            index + 1
                        )}
                    </span>
                    <span
                        className={cn(
                            'px-0.5 text-[11px] leading-tight',
                            step.state === 'current' && 'font-semibold text-brand-600',
                            step.state === 'blocked' && 'font-semibold text-orange-600',
                            step.state === 'done' && 'text-gray-800',
                            step.state === 'todo' && 'text-gray-400',
                        )}
                    >
                        {t(`order.return.steps.${step.key}`)}
                    </span>
                </li>
            ))}
        </ol>
    )
}
