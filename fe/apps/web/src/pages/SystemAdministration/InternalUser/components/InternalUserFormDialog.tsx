import { useEffect, useMemo, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsTransfer } from '@workspace/ui/components/Transfer'
import { AuditInfo } from '@workspace/ui/components/AuditInfo'
import { STATUS_OPTIONS, StatusEnum } from '@/constants/options'
import { useRoleOptions } from '@/services/lookup'
import { ActionButton } from '@/components/Common/ActionButton'
import { InternalUserFormData, InternalUserDetailResponse } from '../types'
import { FormDialogContent } from '@workspace/ui/components/DataTable'

interface InternalUserFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: InternalUserFormData) => void
    selectedUserId?: string | null
    user?: InternalUserDetailResponse
    isReadOnly?: boolean
}

export const InternalUserFormDialog = memo(
    ({ isOpen, onClose, onSubmit, selectedUserId, user, isReadOnly }: InternalUserFormDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const methods = useForm<InternalUserFormData>({ mode: 'onChange' })
        const { data: roles = [] } = useRoleOptions(isOpen)
        const { handleSubmit, reset } = methods
        const roleItems = useMemo(() => roles.map(r => ({ ...r, id: r.code })), [roles])

        useEffect(() => {
            if (isOpen && user) {
                reset({
                    userName: user.userName,
                    personalName: user.personalName,
                    email: user.email ?? '',
                    roles: user.roles ?? [],
                    status: user.status ?? StatusEnum.ACTIVE,
                })
            }
        }, [isOpen, user, reset])

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSubmit(onSubmit)}
                title={dialogTitle(isReadOnly ? 'view' : 'assign')}
                t={t}
                columns={4}
                className="max-w-6xl"
                auditInfo={
                    user && (
                        <AuditInfo
                            createdDate={user.createdDate}
                            createdBy={user.createdBy}
                            updatedDate={user.updatedDate}
                            updatedBy={user.updatedBy}
                        />
                    )
                }
                footer={!isReadOnly && <ActionButton type="submit" actionType="update" actionCode="assign-roles" />}
            >
                <FormProvider {...methods}>
                    <BsInput label={t('common.fields.userName')} name="userName" isDisabled />
                    <BsInput label={t('common.fields.personalName')} name="personalName" isDisabled />
                    <BsInput
                        label={t('common.fields.email')}
                        name="email"
                        isDisabled={isReadOnly || !!selectedUserId}
                    />
                    <BsSelect
                        label={t('common.status')}
                        name="status"
                        options={STATUS_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        isDisabled={isReadOnly || !!selectedUserId}
                    />
                    <BsTransfer
                        label={t('user.fields.role')}
                        name="roles"
                        items={roleItems}
                        valueKey="id"
                        labelKey="name"
                        isRequired
                        rules={{
                            required: t('user.errors.roleRequired'),
                        }}
                        isDisabled={isReadOnly}
                        initialValues={user?.roles || []}
                        titleAvailable={t('common.availableRoles')}
                        titleSelected={t('common.assignedRoles')}
                        containerClassName="col-span-4"
                    />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

InternalUserFormDialog.displayName = 'InternalUserFormDialog'
export default InternalUserFormDialog
