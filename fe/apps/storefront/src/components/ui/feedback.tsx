import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from './button'

export function Spinner({ className }: { className?: string }) {
    const { t } = useTranslation()
    return <Loader2 className={cn('size-5 animate-spin text-brand-500', className)} aria-label={t('common.loading')} />
}

export function PageSpinner() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner className="size-8" />
        </div>
    )
}

interface EmptyStateProps {
    kind?: 'empty' | 'no-match' | 'error'
    title?: string
    description?: string
    action?: ReactNode
    className?: string
}

/** One component for every empty / no-result / error block. */
export function EmptyState({ kind = 'empty', title, description, action, className }: EmptyStateProps) {
    const { t } = useTranslation()
    const Icon = kind === 'error' ? AlertTriangle : kind === 'no-match' ? SearchX : Inbox
    return (
        <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-12 text-center', className)}>
            <Icon className={cn('size-12', kind === 'error' ? 'text-red-400' : 'text-gray-300')} aria-hidden />
            <p className="text-base font-medium text-gray-700">{title ?? t(`common.empty.${kind}.title`)}</p>
            {(description ?? t(`common.empty.${kind}.description`, { defaultValue: '' })) && (
                <p className="max-w-sm text-sm text-gray-500">
                    {description ?? t(`common.empty.${kind}.description`, { defaultValue: '' })}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}

export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
    const { t } = useTranslation()
    return (
        <EmptyState
            kind="error"
            className={className}
            action={
                onRetry && (
                    <Button variant="outline" onClick={onRetry}>
                        {t('common.retry')}
                    </Button>
                )
            }
        />
    )
}
