import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
    Banknote,
    Bike,
    Hourglass,
    PackageCheck,
    PackageX,
    Percent,
    RotateCcw,
    Store,
    UserPlus,
    type LucideIcon,
} from 'lucide-react'
import { Card } from '@workspace/ui/components/Card'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { Button } from '@workspace/ui/components/Button'
import { formatCount, formatVnd } from '../../utils/format'
import type { StatsOverview } from '../../types'

interface KpiCardProps {
    label: string
    value: ReactNode
    icon: LucideIcon
}

const KpiCard = ({ label, value, icon: Icon }: KpiCardProps) => (
    <Card className="gap-2 px-4 py-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="truncate">{label}</span>
            <Icon className="size-4 shrink-0" aria-hidden />
        </div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
)

interface KpiCardsProps {
    overview?: StatsOverview
    isError?: boolean
    onRetry: () => void
}

export const KpiCards = memo(({ overview, isError, onRetry }: KpiCardsProps) => {
    const { t } = useTranslation()

    if (!overview) {
        return isError ? (
            <EmptyState
                kind="error"
                variant="compact"
                action={
                    <Button variant="outline" onPress={onRetry}>
                        <RotateCcw className="size-4" />
                        {t('shopAdmin.dashboard.retry')}
                    </Button>
                }
            />
        ) : null
    }

    return (
        <section
            aria-label={t('shopAdmin.dashboard.kpi.title')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
            <KpiCard label={t('shopAdmin.dashboard.kpi.gmv')} value={formatVnd(overview.gmv)} icon={Banknote} />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.platformRevenue')}
                value={formatVnd(overview.platformRevenue)}
                icon={Percent}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.completedOrders')}
                value={formatCount(overview.completedOrders)}
                icon={PackageCheck}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.cancelledOrders')}
                value={formatCount(overview.cancelledOrders)}
                icon={PackageX}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.newUsers')}
                value={formatCount(overview.newUsers)}
                icon={UserPlus}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.activeStores')}
                value={formatCount(overview.activeStores)}
                icon={Store}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.activeShippers')}
                value={formatCount(overview.activeShippers)}
                icon={Bike}
            />
            <KpiCard
                label={t('shopAdmin.dashboard.kpi.pending')}
                value={
                    <span title={t('shopAdmin.dashboard.kpi.pendingHint')}>
                        {formatCount(overview.pendingStores)} / {formatCount(overview.pendingShippers)}
                    </span>
                }
                icon={Hourglass}
            />
        </section>
    )
})

KpiCards.displayName = 'KpiCards'
