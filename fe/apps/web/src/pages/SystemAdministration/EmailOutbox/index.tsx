import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import type { MenuItem } from '@/types/menu.types'

import { EmailOutboxFilter } from './components/EmailOutboxFilter'
import { EmailOutboxTable } from './components/EmailOutboxTable'
import { EmailOutboxDetailDialog } from './components/EmailOutboxDetailDialog'
import { useEmailOutboxPage } from './hooks/useEmailOutboxPage'

interface EmailOutboxPageProps {
    menuItem?: MenuItem
}

const EmailOutboxPage = memo(({ menuItem }: EmailOutboxPageProps) => {
    const {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        filterProps,
        tableProps,
        dialogProps,
        selectedRows,
        handleResend,
    } = useEmailOutboxPage(menuItem)

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={loadingMessage}
            className="flex flex-col h-full"
        >
            <PageContainer
                title={title}
                isLoading={showFullSkeleton}
                className="flex-1 flex flex-col"
                loadingType="table-list-actions"
            >
                <FormProvider {...filterProps.methods}>
                    <EmailOutboxFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>

                <ActionButton
                    actionType="resendBulk"
                    actionCode="resend-bulk"
                    onPress={() => {
                        const ids = selectedRows.map(r => r.id)
                        handleResend(ids)
                    }}
                    isDisabled={selectedRows.length === 0}
                />

                <EmailOutboxTable {...tableProps} />

                <EmailOutboxDetailDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

EmailOutboxPage.displayName = 'EmailOutboxPage'
export default EmailOutboxPage
