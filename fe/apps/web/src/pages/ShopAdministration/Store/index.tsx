import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ReasonDialog } from '../components/ReasonDialog'
import { StatusTabs } from '../components/StatusTabs'
import { ENTITY_STATUS_OPTIONS } from '../constants'
import { StoreDetailDialog } from './components/StoreDetailDialog'
import { StoreFilter } from './components/StoreFilter'
import { StoreTable } from './components/StoreTable'
import { useStorePage } from './hooks'

const StorePage = memo(() => {
    const {
        t,
        title,
        finalLoading,
        selectedStatus,
        onStatusChange,
        filterProps,
        tableProps,
        detailProps,
        reasonDialogProps,
    } = useStorePage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer title={title} className="flex-1 flex flex-col">
                <StatusTabs
                    tabs={ENTITY_STATUS_OPTIONS}
                    value={selectedStatus}
                    onChange={onStatusChange}
                    ariaLabel={t('shopAdmin.store.statusTabs')}
                />
                <FormProvider {...filterProps.methods}>
                    <StoreFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>
                <StoreTable {...tableProps} />
                <StoreDetailDialog {...detailProps} />
                <ReasonDialog {...reasonDialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

StorePage.displayName = 'StorePage'
export default StorePage
