import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ReasonDialog } from '../components/ReasonDialog'
import { StatusTabs } from '../components/StatusTabs'
import { RETURN_TAB_OPTIONS } from '../constants'
import { OrderDetailDialog } from './components/OrderDetailDialog'
import { OrderFilter } from './components/OrderFilter'
import { OrderTable } from './components/OrderTable'
import { RefundDialog } from './components/RefundDialog'
import { ResolveReturnDialog } from './components/ResolveReturnDialog'
import { useOrderPage } from './hooks'

const OrderPage = memo(() => {
    const {
        t,
        title,
        finalLoading,
        selectedReturnStatus,
        onReturnStatusChange,
        filterProps,
        tableProps,
        detailProps,
        reasonDialogProps,
        resolveReturnDialogProps,
        refundDialogProps,
    } = useOrderPage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer title={title} className="flex-1 flex flex-col">
                <StatusTabs
                    tabs={RETURN_TAB_OPTIONS}
                    value={selectedReturnStatus}
                    onChange={onReturnStatusChange}
                    ariaLabel={t('shopAdmin.order.return.tabsLabel')}
                />
                <FormProvider {...filterProps.methods}>
                    <OrderFilter
                        storeOptions={filterProps.storeOptions}
                        onSearch={filterProps.onSearch}
                        onReset={filterProps.onReset}
                    />
                </FormProvider>
                <OrderTable {...tableProps} />
                <OrderDetailDialog {...detailProps} />
                <ReasonDialog {...reasonDialogProps} />
                <ResolveReturnDialog {...resolveReturnDialogProps} />
                <RefundDialog {...refundDialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

OrderPage.displayName = 'OrderPage'
export default OrderPage
