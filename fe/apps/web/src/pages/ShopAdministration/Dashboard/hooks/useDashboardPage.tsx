import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useMenuLocalizedTitle, usePageSkeleton } from '@/hooks'
import type { GroupBy } from '../../constants'
import type { StatsRangeRequest } from '../../types'
import { API_DATE_FORMAT, formatCount, formatVnd, toApiDate } from '../../utils/format'
import type { TopListItem } from '../components/TopList'
import {
    useRevenueChart,
    useStatsOverview,
    useTopCategories,
    useTopProducts,
    useTopStores,
} from './useDashboardQueries'

const DEFAULT_RANGE_DAYS = 30

export interface DashboardFilterForm {
    dateRange: { start?: string; end?: string } | null
    groupBy: GroupBy
}

interface AppliedFilter {
    range: StatsRangeRequest
    groupBy: GroupBy
}

/** Last `DEFAULT_RANGE_DAYS` days, grouped by day: the initial form values and the filter applied with them. */
const buildDefaults = (): { form: DashboardFilterForm; applied: AppliedFilter } => {
    const start = dayjs()
        .subtract(DEFAULT_RANGE_DAYS - 1, 'day')
        .format(API_DATE_FORMAT)
    const end = dayjs().format(API_DATE_FORMAT)
    return {
        form: { dateRange: { start, end }, groupBy: 'DAY' },
        applied: { range: { fromDate: start, toDate: end }, groupBy: 'DAY' },
    }
}

const toApplied = (form: DashboardFilterForm): AppliedFilter | null => {
    const fromDate = toApiDate(form.dateRange?.start)
    const toDate = toApiDate(form.dateRange?.end)
    return fromDate && toDate ? { range: { fromDate, toDate }, groupBy: form.groupBy } : null
}

export const useDashboardPage = () => {
    const { t } = useTranslation()
    const [defaults] = useState(buildDefaults)
    const methods = useForm<DashboardFilterForm>({ defaultValues: defaults.form })
    const { reset } = methods
    const [applied, setApplied] = useState<AppliedFilter>(defaults.applied)

    const overview = useStatsOverview(applied.range)
    const revenue = useRevenueChart(applied.range, applied.groupBy)
    const topStores = useTopStores(applied.range)
    const topProducts = useTopProducts(applied.range)
    const topCategories = useTopCategories(applied.range)

    const { showFullSkeleton } = usePageSkeleton(overview.isLoading, !!overview.data)
    const menuTitle = useMenuLocalizedTitle()

    const topStoreItems = useMemo<TopListItem[]>(
        () =>
            (topStores.data ?? []).map(item => ({
                key: item.storeId,
                name: item.name,
                imageUrl: item.logoUrl,
                primary: formatVnd(item.gmv),
                secondary:
                    item.orders != null
                        ? t('shopAdmin.dashboard.top.orders', { value: formatCount(item.orders) })
                        : undefined,
            })),
        [topStores.data, t],
    )
    const topProductItems = useMemo<TopListItem[]>(
        () =>
            (topProducts.data ?? []).map(item => ({
                key: item.productId,
                name: item.name,
                imageUrl: item.thumbnailUrl,
                primary: formatVnd(item.revenue),
                secondary:
                    item.quantity != null
                        ? t('shopAdmin.dashboard.top.sold', { value: formatCount(item.quantity) })
                        : undefined,
            })),
        [topProducts.data, t],
    )
    const topCategoryItems = useMemo<TopListItem[]>(
        () =>
            (topCategories.data ?? []).map(item => ({
                key: item.categoryId,
                name: item.name,
                primary: formatVnd(item.revenue),
                secondary:
                    item.quantity != null
                        ? t('shopAdmin.dashboard.top.sold', { value: formatCount(item.quantity) })
                        : undefined,
            })),
        [topCategories.data, t],
    )

    const onSearch = useCallback((form: DashboardFilterForm) => {
        const next = toApplied(form)
        if (next) setApplied(next)
    }, [])
    const onReset = useCallback(() => {
        const next = buildDefaults()
        reset(next.form)
        setApplied(next.applied)
    }, [reset])

    return {
        t,
        title: menuTitle || t('shopAdmin.dashboard.title'),
        showFullSkeleton,
        groupBy: applied.groupBy,
        filterProps: useMemo(() => ({ methods, onSearch, onReset }), [methods, onSearch, onReset]),
        overview,
        revenue,
        topStores,
        topProducts,
        topCategories,
        topStoreItems,
        topProductItems,
        topCategoryItems,
    }
}
