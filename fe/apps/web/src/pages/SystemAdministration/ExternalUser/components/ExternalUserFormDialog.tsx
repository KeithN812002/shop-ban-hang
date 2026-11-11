import { useEffect, useMemo, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { ActionButton } from '@/components/Common/ActionButton'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsTransfer } from '@workspace/ui/components/Transfer'
import { AuditInfo } from '@workspace/ui/components/AuditInfo'
import { STATUS_OPTIONS, StatusEnum } from '@/constants/options'
import { useRoleOptions } from '@/services/lookup'
import { ExternalUserFormData, ExternalUserDetailResponse } from '../types'
import { FormDialogContent } from '@workspace/ui/components/DataTable'

const USER_NAME_PATTERN = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/

const DEFAULT_EXTERNAL_USER_VALUES: ExternalUserFormData = {
    userName: '',
    personalName: '',
    email: '',
    roles: [],
    status: StatusEnum.ACTIVE,
    externalUnitCode: '',
}

interface ExternalUserFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: ExternalUserFormData) => void
    selectedUserId?: string | null
    user?: ExternalUserDetailResponse
    isReadOnly?: boolean
}

export const ExternalUserFormDialog = memo(
    ({ isOpen, onClose, onSubmit, selectedUserId, user, isReadOnly }: ExternalUserFormDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const methods = useForm<ExternalUserFormData>({ mode: 'onChange' })
        const { data: roles = [] } = useRoleOptions(isOpen)
        const { handleSubmit, reset } = methods
        const roleItems = useMemo(() => roles.map(r => ({ ...r, id: r.code })), [roles])

        useEffect(() => {
            if (isOpen) {
                if (selectedUserId && user) {
                    reset({
                        userName: user.userName,
                        personalName: user.personalName,
                        email: user.email ?? '',
                        roles: user.roles ?? [],
                        status: user.status ?? StatusEnum.ACTIVE,
                        externalUnitCode: user.externalUnitCode ?? '',
                    })
                } else if (!selectedUserId) {
                    reset(DEFAULT_EXTERNAL_USER_VALUES)
                }
            }
        }, [isOpen, selectedUserId, user, reset])

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSubmit(onSubmit)}
                title={dialogTitle(isReadOnly ? 'view' : selectedUserId ? 'edit' : 'create')}
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
                footer={
                    !isReadOnly && (
                        <ActionButton
                            type="submit"
                            actionType={selectedUserId ? 'update' : 'create'}
                            actionCode={selectedUserId ? 'update' : 'create'}
                        />
                    )
                }
            >
                <FormProvider {...methods}>
                    <BsInput
                        label={t('common.fields.userName')}
                        name="userName"
                        isRequired
                        maxLength={selectedUserId ? undefined : 46}
                        rules={
                            selectedUserId
                                ? undefined
                                : {
                                      pattern: {
                                          value: USER_NAME_PATTERN,
                                          message: t('user.errors.userNameFormat'),
                                      },
                                  }
                        }
                        isDisabled={!!selectedUserId || isReadOnly}
                        autoFocus={!selectedUserId && !isReadOnly}
                    />
                    <BsInput
                        label={t('common.fields.personalName')}
                        name="personalName"
                        isRequired
                        maxLength={200}
                        isDisabled={isReadOnly}
                    />
                    <BsInput
                        label={t('common.fields.email')}
                        name="email"
                        isRequired
                        maxLength={100}
                        format="email"
                        isDisabled={isReadOnly}
                    />
                    <BsInput
                        label={t('user.fields.externalUnitCode')}
                        name="externalUnitCode"
                        isRequired
                        maxLength={50}
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

ExternalUserFormDialog.displayName = 'ExternalUserFormDialog'
export default ExternalUserFormDialog
