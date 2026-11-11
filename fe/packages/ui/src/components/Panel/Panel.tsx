import { useTranslation } from 'react-i18next'

import { cn } from '@workspace/ui/lib/utils'
import { Card } from '@workspace/ui/components/Card'
import { Spinner } from '@workspace/ui/components/Spinner'

interface PanelProps {
    className?: string
    children: React.ReactNode
}

function Panel({ className, children }: PanelProps) {
    return <Card className={cn('flex flex-col gap-0 overflow-hidden p-1', className)}>{children}</Card>
}

interface PanelHeaderProps {
    className?: string
    children: React.ReactNode
}

function PanelHeader({ className, children }: PanelHeaderProps) {
    return <div className={cn('px-3 pt-2 pb-3 border-b', className)}>{children}</div>
}

interface PanelContentProps {
    className?: string
    children: React.ReactNode
}

function PanelContent({ className, children }: PanelContentProps) {
    return <div className={cn('flex-1 overflow-y-auto px-3 py-3 flex flex-col', className)}>{children}</div>
}

interface PanelFooterProps {
    className?: string
    children: React.ReactNode
}

function PanelFooter({ className, children }: PanelFooterProps) {
    return <div className={cn('px-3 pt-3 pb-2 border-t shrink-0', className)}>{children}</div>
}

interface PanelActionsProps {
    className?: string
    children: React.ReactNode
}

function PanelActions({ className, children }: PanelActionsProps) {
    return <div className={cn('flex gap-2', className)}>{children}</div>
}

interface PanelTitleProps {
    className?: string
    children: React.ReactNode
}

function PanelTitle({ className, children }: PanelTitleProps) {
    return <h2 className={cn('text-lg font-semibold flex items-center gap-2', className)}>{children}</h2>
}

function PanelLoading({ message }: { message?: string }) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <Spinner className="size-10 mb-4" />
            <p className="text-sm font-semibold text-primary animate-pulse tracking-wide italic">
                {message ?? t('common.loading')}
            </p>
        </div>
    )
}

export { Panel, PanelHeader, PanelContent, PanelFooter, PanelActions, PanelTitle, PanelLoading }
