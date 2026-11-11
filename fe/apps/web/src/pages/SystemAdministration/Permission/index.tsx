import { memo } from 'react'
import { Download, Upload } from 'lucide-react'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import type { MenuItem } from '@/types/menu.types'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import { PermissionTypeEnum } from '@/constants/options'
import { usePermissionPage } from './hooks/usePermissionPage'
import { PermissionTree } from './components/PermissionTree'
import { PermissionFormPanel } from './components/PermissionFormPanel'
import { PermissionCreateChildDialog } from './components/PermissionCreateChildDialog'
import { PermissionImportDialog } from './components/PermissionImportDialog'

interface PermissionPageProps {
    menuItem: MenuItem
}

const PermissionPage = memo(({ menuItem }: PermissionPageProps) => {
    const {
        menuTitle,
        isTreeLoading,
        selectedFunction,
        isCreating,
        formData,
        form,
        createChildTypeDialogOpen,
        setCreateChildTypeDialogOpen,
        handleSelect,
        handleOpenCreate,
        startCreateWithChildType,
        handleCancel,
        onSave,
        onDelete,
        viewData,
        isViewLoading,
        isPageLoading,
        searchKeyword,
        setSearchKeyword,
        expandedNodes,
        toggleExpand,
        filteredTree,
        availableParents,
        isAnyMutationPending,
        activePermission,
        loadingMessage,
        t,
        importDialogOpen,
        setImportDialogOpen,
        handleExport,
        handleOpenImport,
    } = usePermissionPage(menuItem)

    return (
        <LoadingOverlay
            isLoading={isPageLoading}
            isFullScreen={isPageLoading}
            text={loadingMessage}
            className="flex-1 flex flex-col min-h-0 h-full [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:min-h-0"
        >
            <PageContainer
                title={menuTitle}
                isLoading={isTreeLoading}
                loadingType="permission"
                className="flex-1 flex flex-col min-h-0 h-full"
                headerActions={
                    <div className="flex gap-2">
                        <ActionButton
                            variant="outline"
                            onPress={handleExport}
                            actionCode="export"
                            icon={Download}
                            label={t('permission.import.btnExport')}
                        />
                        <ActionButton
                            variant="outline"
                            onPress={handleOpenImport}
                            actionCode="import"
                            icon={Upload}
                            label={t('permission.import.btnImport')}
                        />
                    </div>
                }
            >
                <div className="flex-1 flex gap-4 min-h-0 -mb-5">
                    {/* Left Panel - Tree View */}
                    <PermissionTree
                        searchKeyword={searchKeyword}
                        onSearchChange={setSearchKeyword}
                        filteredTree={filteredTree}
                        expandedNodes={expandedNodes}
                        selectedCode={selectedFunction?.code || null}
                        onToggle={toggleExpand}
                        onSelect={handleSelect}
                        onAddNew={handleOpenCreate}
                        isAddNewDisabled={!selectedFunction || isAnyMutationPending}
                    />

                    {/* Right Panel - Form/Detail View */}
                    <PermissionFormPanel
                        selectedFunction={activePermission}
                        isCreating={isCreating}
                        isViewLoading={isViewLoading}
                        formData={formData}
                        form={form}
                        viewData={viewData}
                        availableParents={availableParents}
                        onSave={onSave}
                        onDelete={onDelete}
                        onCancel={handleCancel}
                    />
                </div>

                {/* Child Type Selection Dialog */}
                <PermissionCreateChildDialog
                    isOpen={createChildTypeDialogOpen}
                    onOpenChange={setCreateChildTypeDialogOpen}
                    onStartCreate={startCreateWithChildType}
                    parentType={selectedFunction?.type}
                />

                {/* Import Dialog */}
                <PermissionImportDialog
                    isOpen={importDialogOpen}
                    onOpenChange={setImportDialogOpen}
                    onImported={handleCancel}
                />
            </PageContainer>
        </LoadingOverlay>
    )
})

PermissionPage.displayName = 'PermissionPage'
export default PermissionPage
