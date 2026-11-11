import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
    fetchRevenueChart,
    fetchStatsOverview,
    fetchTopCategories,
    fetchTopProducts,
    fetchTopStores,
} from '../../services/shopAdminService'
import type { GroupBy } from '../../constants'
import type { StatsRangeRequest } from '../../types'

export const TOP_LIMIT = 5
const STALE_TIME = 60_000

export const dashboardKeys = {
    all: ['shop-admin', 'dashboard'] as const,
    overview: (range: StatsRangeRequest) => [...dashboardKeys.all, 'overview', range] as const,
    revenue: (range: StatsRangeRequest, groupBy: GroupBy) => [...dashboardKeys.all, 'revenue', range, groupBy] as const,
    topStores: (range: StatsRangeRequest) => [...dashboardKeys.all, 'top-stores', range] as const,
    topProducts: (range: StatsRangeRequest) => [...dashboardKeys.all, 'top-products', range] as const,
    topCategories: (range: StatsRangeRequest) => [...dashboardKeys.all, 'top-categories', range] as const,
}

const baseOptions = { placeholderData: keepPreviousData, staleTime: STALE_TIME, refetchOnWindowFocus: false } as const

export const useStatsOverview = (range: StatsRangeRequest) =>
    useQuery({ queryKey: dashboardKeys.overview(range), queryFn: () => fetchStatsOverview(range), ...baseOptions })

export const useRevenueChart = (range: StatsRangeRequest, groupBy: GroupBy) =>
    useQuery({
        queryKey: dashboardKeys.revenue(range, groupBy),
        queryFn: () => fetchRevenueChart({ ...range, groupBy }),
        ...baseOptions,
    })

export const useTopStores = (range: StatsRangeRequest) =>
    useQuery({
        queryKey: dashboardKeys.topStores(range),
        queryFn: () => fetchTopStores({ ...range, limit: TOP_LIMIT }),
        ...baseOptions,
    })

export const useTopProducts = (range: StatsRangeRequest) =>
    useQuery({
        queryKey: dashboardKeys.topProducts(range),
        queryFn: () => fetchTopProducts({ ...range, limit: TOP_LIMIT }),
        ...baseOptions,
    })

export const useTopCategories = (range: StatsRangeRequest) =>
    useQuery({
        queryKey: dashboardKeys.topCategories(range),
        queryFn: () => fetchTopCategories({ ...range, limit: TOP_LIMIT }),
        ...baseOptions,
    })
