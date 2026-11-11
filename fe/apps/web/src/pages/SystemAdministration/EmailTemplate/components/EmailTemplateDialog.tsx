import { useEffect, memo, useMemo, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsRichTextEditor } from '@workspace/ui/components/RichTextEditor'
import { BsSelect } from '@workspace/ui/components/Select'
import { AuditInfo } from '@workspace/ui/components/AuditInfo'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { Button } from '@workspace/ui/components/Button'
import { Save } from 'lucide-react'
import {
    EMAIL_OUTBOX_EVENT_TYPE_OPTIONS,
    STATUS_OPTIONS,
    type EmailTemplateDetailResponse,
    type EmailTemplateUpdateRequest,
} from '../types'
import { VariableBadges, type VariableBadgeItem } from '@workspace/ui/components/VariableBadges'

interface EmailTemplateDialogProps {
    isOpen: boolean
    onClose: () => void
    emailTemplate?: EmailTemplateDetailResponse | null
    isFetching?: boolean
    onSave?: (data: EmailTemplateUpdateRequest) => void
    isEditMode?: boolean
}

export const EmailTemplateDialog = memo(
    ({ isOpen, onClose, emailTemplate, isFetching, onSave, isEditMode }: EmailTemplateDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const methods = useForm<EmailTemplateDetailResponse>({
            mode: 'onChange',
        })
        const { reset, handleSubmit } = methods

        useEffect(() => {
            if (isOpen && emailTemplate) {
                reset(emailTemplate)
            }
            if (!isOpen) {
                reset({} as EmailTemplateDetailResponse)
            }
        }, [isOpen, emailTemplate, reset])

        const handleFormSubmit = (data: EmailTemplateDetailResponse) => {
            if (onSave) {
                onSave({
                    id: data.id,
                    subjectTemplate: data.subjectTemplate,
                    bodyTemplate: data.bodyTemplate || '',
                    status: data.status,
                })
            }
        }

        const variableItems = useMemo<VariableBadgeItem[]>(
            () => (emailTemplate?.variables ?? []).map(({ code, label }) => ({ token: `{${code}}`, label })),
            [emailTemplate?.variables],
        )

        const supportedTokens = useMemo(() => new Set(variableItems.map(({ token }) => token)), [variableItems])

        const validateVariables = (value: string) => {
            if (!value) return true
            const matches = value.match(/\{[^}]+\}/g)
            if (!matches) return true
            const unsupported = matches.filter(match => !supportedTokens.has(match))
            if (unsupported.length > 0) {
                return t('emailTemplate.messages.unsupportedVariables', {
                    vars: unsupported.join(', '),
                })
            }
            return true
        }

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                title={dialogTitle(isEditMode ? 'edit' : 'view')}
                columns={3}
                className="max-w-5xl"
                t={t}
                isPending={isFetching}
                onSave={isEditMode ? handleSubmit(handleFormSubmit) : undefined}
                auditInfo={
                    emailTemplate && (
                        <AuditInfo
                            createdDate={emailTemplate.createdDate}
                            createdBy={emailTemplate.createdBy}
                            updatedDate={emailTemplate.updatedDate}
                            updatedBy={emailTemplate.updatedBy}
                        />
                    )
                }
                footer={
                    isEditMode &&
                    onSave && (
                        <Button type="submit" variant="default" isDisabled={isFetching}>
                            <Save className="size-4" />
                            {t('common.save')}
                        </Button>
                    )
                }
            >
                <FormProvider {...methods}>
                    <BsSelect
                        label={t('emailTemplate.fields.eventType')}
                        name="eventType"
                        options={EMAIL_OUTBOX_EVENT_TYPE_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        containerClassName="md:col-span-2"
                        isDisabled
                        isRequired
                    />
                    <BsSelect
                        label={t('common.status')}
                        name="status"
                        options={STATUS_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        containerClassName="md:col-span-1"
                        isDisabled={!isEditMode}
                        isRequired
                    />
                    <VariableBadges variables={variableItems} containerClassName="md:col-span-3" />
                    <BsInput
                        label={t('emailTemplate.fields.subjectTemplate')}
                        name="subjectTemplate"
                        containerClassName="md:col-span-3"
                        isDisabled={!isEditMode}
                        isRequired
                        rules={{
                            required: t('emailTemplate.messages.subjectRequired'),
                            validate: validateVariables,
                        }}
                    />
                    <BsRichTextEditor
                        label={t('emailTemplate.fields.bodyTemplate')}
                        name="bodyTemplate"
                        containerClassName="md:col-span-3"
                        isDisabled={!isEditMode}
                        isRequired
                        rules={{
                            required: t('emailTemplate.messages.bodyRequired'),
                            validate: validateVariables,
                        }}
                    />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

EmailTemplateDialog.displayName = 'EmailTemplateDialog'
