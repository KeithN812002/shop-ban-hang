import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { FolderTree, Package, Store } from 'lucide-react'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { PageScrollArea } from '@workspace/ui/components/PageScrollArea'
import { RevenueChart } from '../components/charts/RevenueChart'
import { StatusBarChart } from '../components/charts/StatusBarChart'
import { DashboardFilter } from './components/DashboardFilter'
import { DashboardSection } from './components/DashboardSection'
import { KpiCards } from './components/KpiCards'
import { TopList } from './components/TopList'
import { useDashboardPage } from './hooks'

const DashboardPage = memo(() => {
    const {
        t,
        title,
        showFullSkeleton,
        groupBy,
        filterProps,
        overview,
        revenue,
        topStores,
        topProducts,
        topCategories,
        topStoreItems,
        topProductItems,
        topCategoryItems,
    } = useDashboardPage()

    return (
        <PageContainer
            title={title}
            isLoading={showFullSkeleton}
            loadingType="dashboard"
            className="flex-1 flex flex-col"
        >
            <FormProvider {...filterProps.methods}>
                <DashboardFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
            </FormProvider>

            <PageScrollArea className="space-y-4">
                <KpiCards overview={overview.data} isError={overview.isError} onRetry={overview.refetch} />

                <div className="grid gap-4 lg:grid-cols-3">
                    <DashboardSection
                        className="lg:col-span-2"
                        title={t('shopAdmin.dashboard.charts.revenue')}
                        isLoading={revenue.isLoading}
                        isError={revenue.isError}
                        onRetry={revenue.refetch}
                    >
                        <RevenueChart data={revenue.data ?? []} groupBy={groupBy} />
                    </DashboardSection>
                    <DashboardSection
                        title={t('shopAdmin.dashboard.charts.ordersByStatus')}
                        isLoading={overview.isLoading}
                        isError={overview.isError && !overview.data}
                        onRetry={overview.refetch}
                    >
                        <StatusBarChart counts={overview.data?.ordersByStatus ?? {}} />
                    </DashboardSection>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <DashboardSection
                        title={t('shopAdmin.dashboard.top.stores')}
                        isLoading={topStores.isLoading}
                        isError={topStores.isError}
                        onRetry={topStores.refetch}
                    >
                        <TopList items={topStoreItems} icon={Store} />
                    </DashboardSection>
                    <DashboardSection
                        title={t('shopAdmin.dashboard.top.products')}
                        isLoading={topProducts.isLoading}
                        isError={topProducts.isError}
                        onRetry={topProducts.refetch}
                    >
                        <TopList items={topProductItems} icon={Package} />
                    </DashboardSection>
                    <DashboardSection
                        title={t('shopAdmin.dashboard.top.categories')}
                        isLoading={topCategories.isLoading}
                        isError={topCategories.isError}
                        onRetry={topCategories.refetch}
                    >
                        <TopList items={topCategoryItems} icon={FolderTree} />
                    </DashboardSection>
                </div>
            </PageScrollArea>
        </PageContainer>
    )
})

DashboardPage.displayName = 'DashboardPage'
export default DashboardPage
