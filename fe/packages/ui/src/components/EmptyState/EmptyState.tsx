import type { ReactNode } from 'react'
import { LucideIcon, Inbox, SearchX, MousePointerClick, Lock, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

export type EmptyStateKind = 'no-records' | 'no-match' | 'needs-input' | 'blocked' | 'error'

interface EmptyStatePreset {
    icon: LucideIcon
    titleKey: string
    descriptionKey?: string
    iconClassName: string
}

const EMPTY_STATE_PRESETS: Record<EmptyStateKind, EmptyStatePreset> = {
    'no-records': {
        icon: Inbox,
        titleKey: 'common.empty.noRecordsTitle',
        iconClassName: 'text-muted-foreground/60',
    },
    'no-match': {
        icon: SearchX,
        titleKey: 'common.empty.noMatchTitle',
        descriptionKey: 'common.empty.noMatchDescription',
        iconClassName: 'text-muted-foreground/60',
    },
    'needs-input': {
        icon: MousePointerClick,
        titleKey: 'common.empty.needsInputTitle',
        descriptionKey: 'common.empty.needsInputDescription',
        iconClassName: 'text-primary/50',
    },
    blocked: {
        icon: Lock,
        titleKey: 'common.empty.blockedTitle',
        iconClassName: 'text-muted-foreground/60',
    },
    error: {
        icon: TriangleAlert,
        titleKey: 'common.empty.errorTitle',
        descriptionKey: 'common.empty.errorDescription',
        iconClassName: 'text-destructive/70',
    },
}

interface EmptyStateProps {
    kind?: EmptyStateKind
    /** Paints icon and title in the destructive colour, for a required list left empty. */
    tone?: 'default' | 'destructive'
    icon?: LucideIcon | null
    iconSize?: number
    title?: string
    description?: string
    action?: ReactNode
    className?: string
    variant?: 'default' | 'compact'
}

function EmptyState({
    kind = 'no-records',
    tone = 'default',
    icon,
    iconSize,
    title,
    description,
    action,
    className,
    variant = 'default',
}: EmptyStateProps) {
    const { t } = useTranslation()
    const preset = EMPTY_STATE_PRESETS[kind]
    const isCompact = variant === 'compact'
    const defaultIconSize = iconSize ?? (isCompact ? 20 : 48)
    const Icon = icon === null ? null : (icon ?? preset.icon)
    const resolvedTitle = title ?? t(preset.titleKey as never)
    const resolvedDescription = description ?? (preset.descriptionKey ? t(preset.descriptionKey as never) : undefined)

    return (
        <div
            className={cn(
                'flex items-center justify-center text-center px-6',
                isCompact ? 'flex-row gap-2 py-2 min-h-0' : 'flex-col h-full min-h-[150px] py-6',
                className,
            )}
        >
            {Icon && (
                <Icon
                    size={defaultIconSize}
                    className={cn(
                        !isCompact && 'mb-4',
                        tone === 'destructive' ? 'text-destructive/70' : preset.iconClassName,
                    )}
                />
            )}
            <h3
                className={cn(
                    'font-semibold',
                    tone === 'destructive' ? 'text-destructive' : 'text-slate-600',
                    isCompact ? 'text-sm mb-0' : 'text-base mb-1',
                )}
            >
                {resolvedTitle}
            </h3>
            {!isCompact && resolvedDescription && (
                <p className="max-w-md text-sm font-medium text-foreground/70 leading-relaxed">{resolvedDescription}</p>
            )}
            {!isCompact && action && <div className="mt-4 flex items-center justify-center gap-2">{action}</div>}
        </div>
    )
}

export { EmptyState }
