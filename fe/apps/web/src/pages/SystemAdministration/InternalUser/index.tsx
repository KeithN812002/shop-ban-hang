import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import { Lock, Unlock, Trash2 } from 'lucide-react'
import { StatusEnum } from '@/constants/options'
import { InternalUserFilter } from './components/InternalUserFilter'
import { InternalUserTable } from './components/InternalUserTable'
import { InternalUserFormDialog } from './components/InternalUserFormDialog'
import { useInternalUserPage } from './hooks'

const InternalUserPage = memo(() => {
    const {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        filterProps,
        tableProps,
        dialogProps,
    } = useInternalUserPage()

    const hasSelection = selectedRows.length > 0
    const canActivate = hasSelection && selectedRows.every(row => row.status === StatusEnum.INACTIVE)
    const canInactivate = hasSelection && selectedRows.every(row => row.status === StatusEnum.ACTIVE)

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
                    <InternalUserFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>

                <div className="flex flex-wrap gap-2">
                    <ActionButton
                        onPress={handleActiveBulk}
                        actionCode="active-bulk"
                        isDisabled={!canActivate}
                        icon={Unlock}
                        label={t('user.actions.activeBulk')}
                    />
                    <ActionButton
                        onPress={handleInactiveBulk}
                        actionCode="inactive-bulk"
                        isDisabled={!canInactivate}
                        icon={Lock}
                        label={t('user.actions.inactiveBulk')}
                        variant="warning"
                    />
                    <ActionButton
                        onPress={handleDeleteBulk}
                        actionCode="delete-bulk"
                        isDisabled={!hasSelection}
                        icon={Trash2}
                        label={t('user.actions.deleteBulk')}
                        variant="destructive"
                    />
                </div>

                <InternalUserTable {...tableProps} />

                <InternalUserFormDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

InternalUserPage.displayName = 'InternalUserPage'
export default InternalUserPage
