import { memo } from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Boxes } from 'lucide-react'
import { Panel, PanelHeader, PanelContent, PanelFooter, PanelTitle } from '@workspace/ui/components/Panel'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { PermissionTypeEnum } from '@/constants/options'
import { type PermissionTreeNode, type PermissionFormData, type PermissionDetailResponse } from '../types'
import { ModuleDetail } from './ModuleDetail'
import { GroupDetail } from './GroupDetail'
import { MenuDetail } from './MenuDetail'
import { PageDetail } from './PageDetail'
import { ActionButton } from '@/components/Common/ActionButton'
import { usePermissionAction } from '@/hooks/usePermissionAction'

interface PermissionFormPanelProps {
    selectedFunction: PermissionTreeNode | null
    isCreating: boolean
    isViewLoading?: boolean
    formData: PermissionFormData | null
    form: UseFormReturn<PermissionFormData>
    viewData?: PermissionDetailResponse
    availableParents: PermissionTreeNode[]
    onSave: () => void
    onDelete: () => void
    onCancel: () => void
}

export const PermissionFormPanel = memo(
    ({
        selectedFunction,
        isCreating,
        formData,
        form,
        viewData,
        availableParents,
        onSave,
        onDelete,
        onCancel,
    }: PermissionFormPanelProps) => {
        const { t } = useTranslation()
        const { checkPermission } = usePermissionAction()

        const canDelete =
            !isCreating && selectedFunction?.type !== PermissionTypeEnum.MODULE && checkPermission('delete')
        const canSave = checkPermission(isCreating ? 'create' : 'update')

        const getBaseTitle = (type?: string, mode: 'create' | 'detail' = 'detail'): string => {
            if (!type) return ''
            if (mode === 'create') {
                switch (type) {
                    case PermissionTypeEnum.MODULE:
                        return t('permission.title.createEmptyModule')
                    case PermissionTypeEnum.GROUP:
                        return t('permission.title.createEmptyGroup')
                    case PermissionTypeEnum.MENU:
                        return t('permission.title.createEmptyMenu')
                    case PermissionTypeEnum.PAGE:
                        return t('permission.title.createEmptyPage')
                    default:
                        return t('permission.title.createEmptyGroup')
                }
            }
            switch (type) {
                case PermissionTypeEnum.MODULE:
                    return t('permission.title.detailModule')
                case PermissionTypeEnum.GROUP:
                    return t('permission.title.detailGroup')
                case PermissionTypeEnum.MENU:
                    return t('permission.title.detailMenu')
                case PermissionTypeEnum.PAGE:
                    return t('permission.title.detailPage')
                default:
                    return t('permission.title.detailGroup')
            }
        }

        const getPanelTitle = (): string => {
            if (isCreating) {
                if (!formData) return t('permission.title.createEmptyGroup')
                const name = formData.name?.trim()
                const base = getBaseTitle(formData.type, 'create')
                if (name) return `${base} - ${name}`
                return base
            }
            if (!selectedFunction) return ''
            return `${getBaseTitle(selectedFunction.type, 'detail')} - ${selectedFunction.name}`
        }

        const detailData = isCreating ? null : viewData || null

        return (
            <Panel className="flex-1">
                {selectedFunction || isCreating ? (
                    <>
                        <PanelHeader className="-mx-1 min-h-14 px-4">
                            <PanelTitle>{getPanelTitle()}</PanelTitle>
                        </PanelHeader>
                        <PanelContent className="scrollbar-float scrollbar-divided -mr-1 pr-1.5">
                            {formData && (
                                <FormProvider {...form}>
                                    <div className="space-y-4">
                                        {(() => {
                                            switch (formData?.type) {
                                                case PermissionTypeEnum.MODULE:
                                                    return <ModuleDetail isReadOnly={!canSave} />
                                                case PermissionTypeEnum.GROUP:
                                                    return (
                                                        <GroupDetail
                                                            availableParents={availableParents}
                                                            isReadOnly={!canSave}
                                                        />
                                                    )
                                                case PermissionTypeEnum.MENU:
                                                    return (
                                                        <MenuDetail
                                                            data={detailData as PermissionDetailResponse}
                                                            availableParents={availableParents}
                                                            isReadOnly={!canSave}
                                                        />
                                                    )
                                                case PermissionTypeEnum.PAGE:
                                                    return (
                                                        <PageDetail
                                                            data={detailData as PermissionDetailResponse}
                                                            availableParents={availableParents}
                                                            isReadOnly={!canSave}
                                                        />
                                                    )
                                                default:
                                                    return (
                                                        <div className="text-muted-foreground">
                                                            {t('permission.messages.unsupportedType')}
                                                        </div>
                                                    )
                                            }
                                        })()}
                                    </div>
                                </FormProvider>
                            )}
                        </PanelContent>
                        {formData && (canSave || canDelete) && (
                            <PanelFooter className="-mx-1 px-4">
                                <div className="flex gap-2 justify-end">
                                    {canDelete && (
                                        <ActionButton
                                            variant="destructive"
                                            onPress={onDelete}
                                            actionCode="delete"
                                            actionType="delete"
                                        />
                                    )}

                                    <ActionButton
                                        onPress={onSave}
                                        actionCode={isCreating ? 'create' : 'update'}
                                        actionType={isCreating ? 'create' : 'update'}
                                    />
                                    <ActionButton variant="outline" onPress={onCancel} actionType="cancel" />
                                </div>
                            </PanelFooter>
                        )}
                    </>
                ) : (
                    <EmptyState
                        kind="needs-input"
                        icon={Boxes}
                        title={t('permission.messages.selectItemToViewDetail')}
                        description=""
                    />
                )}
            </Panel>
        )
    },
)

PermissionFormPanel.displayName = 'PermissionFormPanel'
