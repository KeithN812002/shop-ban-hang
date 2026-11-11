import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ReasonDialog } from '../components/ReasonDialog'
import { StatusTabs } from '../components/StatusTabs'
import { ENTITY_STATUS_OPTIONS } from '../constants'
import { ShipperDetailDialog } from './components/ShipperDetailDialog'
import { ShipperFilter } from './components/ShipperFilter'
import { ShipperTable } from './components/ShipperTable'
import { useShipperPage } from './hooks'

const ShipperPage = memo(() => {
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
    } = useShipperPage()

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
                    ariaLabel={t('shopAdmin.shipper.statusTabs')}
                />
                <FormProvider {...filterProps.methods}>
                    <ShipperFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>
                <ShipperTable {...tableProps} />
                <ShipperDetailDialog {...detailProps} />
                <ReasonDialog {...reasonDialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

ShipperPage.displayName = 'ShipperPage'
export default ShipperPage
