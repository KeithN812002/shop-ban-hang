import { useEffect, memo } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { BsInput, BsTextArea } from '@workspace/ui/components/Textfield'
import { Label } from '@workspace/ui/components/Field'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsRichTextEditor } from '@workspace/ui/components/RichTextEditor'
import { AuditInfo } from '@workspace/ui/components/AuditInfo'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { Button } from '@workspace/ui/components/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/Table'
import { Badge } from '@workspace/ui/components/Badge'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { RotateCw } from 'lucide-react'
import dayjs from 'dayjs'
import { EMAIL_OUTBOX_STATUS_OPTIONS, EMAIL_OUTBOX_EVENT_TYPE_OPTIONS, type EmailOutboxDetailResponse } from '../types'

interface EmailOutboxDetailDialogProps {
    isOpen: boolean
    onClose: () => void
    email?: EmailOutboxDetailResponse | null
    isFetching?: boolean
    onResend?: (id: string) => void
}

export const EmailOutboxDetailDialog = memo(
    ({ isOpen, onClose, email, isFetching, onResend }: EmailOutboxDetailDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()
        const { checkPermission } = usePermissionAction()
        const methods = useForm<EmailOutboxDetailResponse>()
        const { reset } = methods

        const canResend = checkPermission('resend')

        useEffect(() => {
            if (isOpen && email) {
                reset({
                    ...email,
                    sentAt: email.sentAt ? dayjs(email.sentAt).format('HH:mm:ss DD/MM/YYYY') : '',
                })
            }
            if (!isOpen) {
                reset({} as EmailOutboxDetailResponse)
            }
        }, [isOpen, email, reset])

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                title={dialogTitle('view')}
                columns={3}
                className="max-w-5xl"
                t={t}
                isPending={isFetching}
                auditInfo={
                    email && (
                        <AuditInfo
                            createdDate={email.createdDate}
                            createdBy={email.createdBy}
                            updatedDate={email.updatedDate}
                            updatedBy={email.updatedBy}
                        />
                    )
                }
                footer={
                    (email?.status === 'FAIL' || email?.status === 'CANCELLED') &&
                    canResend &&
                    onResend && (
                        <Button variant="warning" onPress={() => onResend(email.id)} isDisabled={isFetching}>
                            <RotateCw className="size-4" />
                            {t('emailOutbox.actions.resend')}
                        </Button>
                    )
                }
            >
                <FormProvider {...methods}>
                    <BsSelect
                        label={t('emailOutbox.fields.eventType')}
                        name="eventType"
                        options={EMAIL_OUTBOX_EVENT_TYPE_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        containerClassName="md:col-span-2"
                        isDisabled
                    />
                    <BsSelect
                        label={t('emailOutbox.fields.status')}
                        name="status"
                        options={EMAIL_OUTBOX_STATUS_OPTIONS}
                        valueKey="value"
                        labelKey="label"
                        isDisabled
                    />

                    {(() => {
                        const variablesStr = methods.watch('variables')
                        let parsedVariables: Record<string, string> = {}
                        let isJson = false
                        try {
                            if (variablesStr) {
                                parsedVariables = JSON.parse(variablesStr)
                                isJson = typeof parsedVariables === 'object' && parsedVariables !== null
                            }
                        } catch (e) {
                            isJson = false
                        }

                        if (isJson && Object.keys(parsedVariables).length > 0) {
                            const entries = Object.entries(parsedVariables)
                            return (
                                <div className="md:col-span-3">
                                    <Table trackScroll={false} containerClassName="h-fit">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-44">
                                                    {t('emailOutbox.fields.variableKey')}
                                                </TableHead>
                                                <TableHead>{t('emailOutbox.fields.variableValue')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {entries.map(([key, val]) => (
                                                <TableRow key={key}>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-mono font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-500/20">
                                                            {key}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-normal break-words">
                                                        {val}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        }

                        return (
                            <BsTextArea
                                label={t('emailOutbox.fields.variables')}
                                name="variables"
                                rows={3}
                                containerClassName="md:col-span-3"
                                isDisabled
                            />
                        )
                    })()}

                    {(() => {
                        const receiverStr = methods.watch('receiver')
                        if (!receiverStr) return null
                        const emails = receiverStr
                            .split(',')
                            .map(e => e.trim())
                            .filter(Boolean)
                        return (
                            <div className="md:col-span-3 flex flex-col gap-1.5">
                                <Label>{t('emailOutbox.fields.receiver')}</Label>
                                <div className="flex flex-wrap gap-1.5 p-2.5 border border-input rounded bg-neutral-50/50 min-h-[38px]">
                                    {emails.map(email => (
                                        <Badge key={email} variant="secondary" className="font-normal text-xs py-0.5">
                                            {email}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}

                    <BsInput
                        label={t('emailOutbox.fields.subject')}
                        name="subject"
                        containerClassName="md:col-span-3"
                        isDisabled
                    />

                    <BsRichTextEditor
                        label={t('emailOutbox.fields.body')}
                        name="body"
                        containerClassName="md:col-span-3"
                        isDisabled
                    />

                    <BsInput label={t('emailOutbox.fields.sentAt')} name="sentAt" isDisabled />
                    <BsInput label={t('emailOutbox.fields.retryCount')} name="retryCount" isDisabled />

                    <BsTextArea
                        label={t('emailOutbox.fields.errorMessage')}
                        name="errorMessage"
                        className="text-red-600 font-mono"
                        containerClassName="md:col-span-3"
                        rows={3}
                        isDisabled
                    />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

EmailOutboxDetailDialog.displayName = 'EmailOutboxDetailDialog'
