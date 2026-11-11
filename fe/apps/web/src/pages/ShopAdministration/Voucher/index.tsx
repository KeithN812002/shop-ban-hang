import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import { VoucherFilter } from './components/VoucherFilter'
import { VoucherFormDialog } from './components/VoucherFormDialog'
import { VoucherTable } from './components/VoucherTable'
import { useVoucherPage } from './hooks'

const VoucherPage = memo(() => {
    const { t, title, finalLoading, handleAdd, filterProps, tableProps, dialogProps } = useVoucherPage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer
                title={title}
                className="flex-1 flex flex-col"
                headerActions={<ActionButton onPress={handleAdd} actionCode="create" actionType="addNew" />}
            >
                <FormProvider {...filterProps.methods}>
                    <VoucherFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>
                <VoucherTable {...tableProps} />
                <VoucherFormDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

VoucherPage.displayName = 'VoucherPage'
export default VoucherPage
