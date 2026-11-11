import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@workspace/ui/components/Badge'
import { cn } from '@workspace/ui/lib/utils'
import { STATUS_META, type BadgeTone, type StatusDomain, type StatusMeta } from '../constants'

const TONE_CLASS: Record<BadgeTone, string> = {
    success:
        'border-green-500/30 bg-green-50 text-green-600 dark:border-green-400/30 dark:bg-green-950/40 dark:text-green-400',
    warning:
        'border-amber-500/30 bg-amber-50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'border-red-500/30 bg-red-50 text-red-600 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-400',
    info: 'border-sky-500/30 bg-sky-50 text-sky-600 dark:border-sky-400/30 dark:bg-sky-950/40 dark:text-sky-400',
    neutral:
        'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-950/40 dark:text-slate-400',
}

interface StatusBadgeProps {
    domain: StatusDomain
    status?: string | null
    className?: string
}

export const StatusBadge = memo(({ domain, status, className }: StatusBadgeProps) => {
    const { t } = useTranslation()
    if (!status) return null
    const meta = (STATUS_META[domain] as Record<string, StatusMeta>)[status]
    return (
        <Badge variant="outline" className={cn('font-semibold', TONE_CLASS[meta?.tone ?? 'neutral'], className)}>
            {meta ? t(meta.label) : status}
        </Badge>
    )
})

StatusBadge.displayName = 'StatusBadge'
