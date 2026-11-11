import { memo, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Ban, Check } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { BsTextArea } from '@workspace/ui/components/Textfield'
import { Button } from '@workspace/ui/components/Button'
import { zodFormResolver } from '../../utils/zodResolver'

const NOTE_MAX_LENGTH = 500

interface ResolveReturnForm {
    note: string
}

export interface ResolveReturnDialogProps {
    isOpen: boolean
    orderCode?: string
    isPending?: boolean
    onClose: () => void
    onSubmit: (data: { approve: boolean; note: string }) => Promise<void>
}

const preventSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault()
}

/** Admin decision on a disputed return: accept the return (shop must take the goods back) or reject the dispute. */
export const ResolveReturnDialog = memo(
    ({ isOpen, orderCode, isPending, onClose, onSubmit }: ResolveReturnDialogProps) => {
        const { t } = useTranslation()
        const schema = useMemo(() => {
            const label = t('shopAdmin.order.return.resolve.note')
            return z.object({
                note: z
                    .string()
                    .trim()
                    .min(1, t('forms.validation.required', { label }))
                    .max(NOTE_MAX_LENGTH, t('forms.validation.maxLength', { label, max: NOTE_MAX_LENGTH })),
            })
        }, [t])
        const methods = useForm<ResolveReturnForm>({
            defaultValues: { note: '' },
            resolver: zodFormResolver<ResolveReturnForm>(schema),
        })
        const { handleSubmit, reset } = methods

        useEffect(() => {
            if (isOpen) reset({ note: '' })
        }, [isOpen, reset])

        const decide = (approve: boolean) =>
            handleSubmit(async values => {
                try {
                    await onSubmit({ approve, note: values.note })
                } catch {
                    // The failure toast comes from the global mutation handler; keep the dialog open for a retry.
                }
            })()

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={preventSubmit}
                isPending={isPending}
                title={t('shopAdmin.order.return.resolve.title')}
                t={t}
                columns={1}
                className="max-w-lg"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="destructive"
                            isDisabled={isPending}
                            onPress={() => void decide(false)}
                        >
                            <Ban className="size-4" />
                            {t('shopAdmin.order.return.resolve.reject')}
                        </Button>
                        <Button type="button" isDisabled={isPending} onPress={() => void decide(true)}>
                            <Check className="size-4" />
                            {t('shopAdmin.order.return.resolve.approve')}
                        </Button>
                    </>
                }
            >
                <FormProvider {...methods}>
                    <p className="text-sm text-muted-foreground">
                        {t('shopAdmin.order.return.resolve.description', { name: orderCode ?? '' })}
                    </p>
                    <BsTextArea
                        label={t('shopAdmin.order.return.resolve.note')}
                        name="note"
                        isRequired
                        maxLength={NOTE_MAX_LENGTH}
                        autoFocus
                    />
                </FormProvider>
            </FormDialogContent>
        )
    },
)

ResolveReturnDialog.displayName = 'ResolveReturnDialog'
