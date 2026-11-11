import { memo, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Ban, type LucideIcon } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { BsTextArea } from '@workspace/ui/components/Textfield'
import { Button } from '@workspace/ui/components/Button'
import { zodFormResolver } from '../utils/zodResolver'

const REASON_MAX_LENGTH = 500

interface ReasonForm {
    reason: string
}

export interface ReasonDialogProps {
    isOpen: boolean
    title: string
    description?: string
    confirmLabel: string
    confirmIcon?: LucideIcon
    confirmVariant?: 'default' | 'warning' | 'destructive'
    isPending?: boolean
    onClose: () => void
    onSubmit: (reason: string) => Promise<void>
}

/** Collects the mandatory reason for reject / suspend / ban / cancel actions. */
export const ReasonDialog = memo(
    ({
        isOpen,
        title,
        description,
        confirmLabel,
        confirmIcon: Icon = Ban,
        confirmVariant = 'destructive',
        isPending,
        onClose,
        onSubmit,
    }: ReasonDialogProps) => {
        const { t } = useTranslation()
        const schema = useMemo(() => {
            const label = t('shopAdmin.reason.label')
            return z.object({
                reason: z
                    .string()
                    .trim()
                    .min(1, t('forms.validation.required', { label }))
                    .max(REASON_MAX_LENGTH, t('forms.validation.maxLength', { label, max: REASON_MAX_LENGTH })),
            })
        }, [t])
        const methods = useForm<ReasonForm>({
            defaultValues: { reason: '' },
            resolver: zodFormResolver<ReasonForm>(schema),
        })
        const { handleSubmit, reset } = methods

        useEffect(() => {
            if (isOpen) reset({ reason: '' })
        }, [isOpen, reset])

        const submit = handleSubmit(async values => {
            try {
                await onSubmit(values.reason)
            } catch {
                // The failure toast comes from the global mutation handler; keep the dialog open for a retry.
            }
        })

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={submit}
                isPending={isPending}
                title={title}
                t={t}
                columns={1}
                className="max-w-lg"
                footer={
                    <Button type="submit" variant={confirmVariant} isDisabled={isPending}>
                        <Icon className="size-4" />
                        {confirmLabel}
                    </Button>
                }
            >
                <FormProvider {...methods}>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <BsTextArea
                        label={t('shopAdmin.reason.label')}
                        name="reason"
                        isRequired
                        maxLength={REASON_MAX_LENGTH}
                        autoFocus
                    />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

ReasonDialog.displayName = 'ReasonDialog'
