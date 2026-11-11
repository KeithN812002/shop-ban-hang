import { useEffect, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { ActionButton } from '@/components/Common/ActionButton'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { AuditInfo } from '@workspace/ui/components/AuditInfo'
import { useRoleById } from '../hooks'
import { useActivePermissionsForRole } from '../../Permission/hooks'
import { STATUS_OPTIONS, StatusEnum } from '@/constants/options'
import { RoleFormData } from '../types'
import { RolePermissionTree } from './RolePermissionTree'
import { FormDialogContent } from '@workspace/ui/components/DataTable'

const DEFAULT_ROLE_FORM_VALUES: RoleFormData = {
    code: 'ROLE_XXXXXX',
    name: '',
    status: StatusEnum.ACTIVE,
    permissionIds: [],
}

interface RoleFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: RoleFormData) => void
    selectedRoleId?: string | null
    isPending?: boolean
    isReadOnly?: boolean
}

export const RoleFormDialog = memo(
    ({ isOpen, onClose, onSubmit, selectedRoleId, isPending, isReadOnly }: RoleFormDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const methods = useForm<RoleFormData>({ mode: 'onChange' })
        const { data: fetchedData, isLoading } = useRoleById(selectedRoleId ?? null, isOpen && !!selectedRoleId)
        const { data: permissions = [], isLoading: isLoadingPermissions } = useActivePermissionsForRole(isOpen)
        const { handleSubmit, reset } = methods

        const isDialogLoading = isLoading || isPending || isLoadingPermissions

        useEffect(() => {
            if (isOpen) {
                if (selectedRoleId && fetchedData) {
                    reset({
                        ...fetchedData,
                        status: fetchedData.status || StatusEnum.ACTIVE,
                    })
                } else if (!selectedRoleId) {
                    reset(DEFAULT_ROLE_FORM_VALUES)
                }
            }
        }, [isOpen, selectedRoleId, fetchedData, reset])

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSubmit(onSubmit)}
                title={dialogTitle(isReadOnly ? 'view' : selectedRoleId ? 'edit' : 'create')}
                t={t}
                columns={3}
                className="max-w-4xl"
                auditInfo={
                    !isLoading &&
                    fetchedData && (
                        <AuditInfo
                            createdDate={fetchedData.createdDate}
                            createdBy={fetchedData.createdBy}
                            updatedDate={fetchedData.updatedDate}
                            updatedBy={fetchedData.updatedBy}
                        />
                    )
                }
                footer={
                    !isReadOnly && (
                        <ActionButton
                            type="submit"
                            actionType={selectedRoleId ? 'update' : 'create'}
                            actionCode={selectedRoleId ? 'update' : 'create'}
                        />
                    )
                }
            >
                <FormProvider {...methods}>
                    <BsInput label={t('role.fields.code')} isRequired name="code" isDisabled />
                    <BsInput
                        label={t('role.fields.name')}
                        name="name"
                        isRequired
                        maxLength={200}
                        autoFocus={!selectedRoleId && !isReadOnly}
                        isDisabled={isReadOnly}
                    />
                    <BsSelect
                        label={t('common.status')}
                        name="status"
                        options={STATUS_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        isRequired
                        isDisabled={isReadOnly}
                    />
                    <RolePermissionTree permissions={permissions} isDisabled={isReadOnly || isPending} />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

RoleFormDialog.displayName = 'RoleFormDialog'
export default RoleFormDialog
