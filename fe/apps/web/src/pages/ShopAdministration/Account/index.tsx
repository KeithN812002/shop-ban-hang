import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { AccountFilter } from './components/AccountFilter'
import { AccountTable } from './components/AccountTable'
import { useAccountPage } from './hooks'

const AccountPage = memo(() => {
    const { t, title, finalLoading, filterProps, tableProps } = useAccountPage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer title={title} className="flex-1 flex flex-col">
                <FormProvider {...filterProps.methods}>
                    <AccountFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>
                <AccountTable {...tableProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

AccountPage.displayName = 'AccountPage'
export default AccountPage
