import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { ActionButton } from '@/components/Common/ActionButton'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { Lock, Unlock, Trash2 } from 'lucide-react'
import { StatusEnum } from '@/constants/options'
import { RoleFilter } from './components/RoleFilter'
import { RoleTable } from './components/RoleTable'
import { RoleFormDialog } from './components/RoleFormDialog'
import { useRolePage } from './hooks'
import type { MenuItem } from '@/types/menu.types'

interface RolePageProps {
    menuItem: MenuItem
}

const RolePage = memo(({ menuItem }: RolePageProps) => {
    const {
        t,
        title,
        finalLoading,
        showFullSkeleton,
        handleAdd,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        filterProps,
        tableProps,
        dialogProps,
        loadingMessage,
    } = useRolePage(menuItem)

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
                headerActions={<ActionButton onPress={handleAdd} actionType="addNew" actionCode="create" />}
            >
                <FormProvider {...filterProps.methods}>
                    <RoleFilter onSearch={filterProps.onSearch} onReset={filterProps.onReset} />
                </FormProvider>

                <div className="flex flex-wrap gap-2">
                    <ActionButton
                        onPress={handleActiveBulk}
                        actionCode="active-bulk"
                        isDisabled={!canActivate}
                        icon={Unlock}
                        label={t('role.actions.activeBulk')}
                    />
                    <ActionButton
                        onPress={handleInactiveBulk}
                        actionCode="inactive-bulk"
                        isDisabled={!canInactivate}
                        icon={Lock}
                        label={t('role.actions.inactiveBulk')}
                        variant="warning"
                    />
                    <ActionButton
                        onPress={handleDeleteBulk}
                        actionCode="delete-bulk"
                        isDisabled={!hasSelection}
                        icon={Trash2}
                        label={t('role.actions.deleteBulk')}
                        variant="destructive"
                    />
                </div>

                <RoleTable {...tableProps} />

                <RoleFormDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

RolePage.displayName = 'RolePage'
export default RolePage
