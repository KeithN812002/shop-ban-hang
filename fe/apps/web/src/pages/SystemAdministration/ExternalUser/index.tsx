import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import { KeyRound, Lock, Unlock, Trash2 } from 'lucide-react'
import { StatusEnum } from '@/constants/options'
import { ExternalUserFilter } from './components/ExternalUserFilter'
import { ExternalUserTable } from './components/ExternalUserTable'
import { ExternalUserFormDialog } from './components/ExternalUserFormDialog'
import { useExternalUserPage } from './hooks'

const ExternalUserPage = memo(() => {
    const {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        handleAdd,
        handleResetPasswordBulk,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        filterProps,
        tableProps,
        dialogProps,
    } = useExternalUserPage()

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
                headerActions={<ActionButton onPress={handleAdd} actionCode="create" actionType="addNew" />}
            >
                <FormProvider {...filterProps.methods}>
                    <ExternalUserFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
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
                        onPress={handleResetPasswordBulk}
                        actionCode="reset-password-bulk"
                        isDisabled={!hasSelection}
                        icon={KeyRound}
                        label={t('user.actions.resetPasswordBulk')}
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

                <ExternalUserTable {...tableProps} />

                <ExternalUserFormDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

ExternalUserPage.displayName = 'ExternalUserPage'
export default ExternalUserPage
