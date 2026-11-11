import { memo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'

interface DashboardSectionProps {
    title: string
    isLoading?: boolean
    isError?: boolean
    onRetry?: () => void
    className?: string
    children: ReactNode
}

const SKELETON_ROWS = 4

/** Titled card that owns the loading and error states of one dashboard query. */
export const DashboardSection = memo(
    ({ title, isLoading, isError, onRetry, className, children }: DashboardSectionProps) => {
        const { t } = useTranslation()

        return (
            <Card className={cn('gap-3 px-4 py-4', className)}>
                <h2 className="text-sm font-semibold">{title}</h2>
                {isLoading ? (
                    <div className="space-y-3" aria-busy>
                        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                            <Skeleton key={index} className="h-6 w-full" />
                        ))}
                    </div>
                ) : isError ? (
                    <EmptyState
                        kind="error"
                        variant="compact"
                        action={
                            onRetry && (
                                <Button variant="outline" onPress={onRetry}>
                                    <RotateCcw className="size-4" />
                                    {t('shopAdmin.dashboard.retry')}
                                </Button>
                            )
                        }
                    />
                ) : (
                    children
                )}
            </Card>
        )
    },
)

DashboardSection.displayName = 'DashboardSection'
