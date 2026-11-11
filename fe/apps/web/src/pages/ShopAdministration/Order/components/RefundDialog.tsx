import { memo, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Banknote } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { BsInput, BsTextArea } from '@workspace/ui/components/Textfield'
import { Button } from '@workspace/ui/components/Button'
import { zodFormResolver } from '../../utils/zodResolver'

const NOTE_MAX_LENGTH = 500
const URL_MAX_LENGTH = 500
/** Stored upload paths (`/shop/public/file/...`) or absolute http(s) links. */
const PROOF_URL_REGEX = /^(\/shop\/public\/file\/\S+|https?:\/\/\S+)$/i

interface RefundForm {
    proofImageUrl: string
    note: string
}

export interface RefundDialogProps {
    isOpen: boolean
    orderCode?: string
    isPending?: boolean
    onClose: () => void
    onSubmit: (data: { proofImageUrl?: string; note?: string }) => Promise<void>
}

/** Records the manual bank refund: optional receipt URL and note. */
export const RefundDialog = memo(({ isOpen, orderCode, isPending, onClose, onSubmit }: RefundDialogProps) => {
    const { t } = useTranslation()
    const schema = useMemo(
        () =>
            z.object({
                proofImageUrl: z
                    .string()
                    .trim()
                    .max(
                        URL_MAX_LENGTH,
                        t('forms.validation.maxLength', {
                            label: t('shopAdmin.order.return.refund.proofUrl'),
                            max: URL_MAX_LENGTH,
                        }),
                    )
                    .refine(
                        value => value === '' || PROOF_URL_REGEX.test(value),
                        t('shopAdmin.order.return.refund.proofUrlInvalid'),
                    ),
                note: z
                    .string()
                    .trim()
                    .max(
                        NOTE_MAX_LENGTH,
                        t('forms.validation.maxLength', {
                            label: t('shopAdmin.order.return.refund.note'),
                            max: NOTE_MAX_LENGTH,
                        }),
                    ),
            }),
        [t],
    )
    const methods = useForm<RefundForm>({
        defaultValues: { proofImageUrl: '', note: '' },
        resolver: zodFormResolver<RefundForm>(schema),
    })
    const { handleSubmit, reset } = methods

    useEffect(() => {
        if (isOpen) reset({ proofImageUrl: '', note: '' })
    }, [isOpen, reset])

    const submit = handleSubmit(async values => {
        try {
            await onSubmit({ proofImageUrl: values.proofImageUrl || undefined, note: values.note || undefined })
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
            title={t('shopAdmin.order.return.refund.title')}
            t={t}
            columns={1}
            className="max-w-lg"
            footer={
                <Button type="submit" isDisabled={isPending}>
                    <Banknote className="size-4" />
                    {t('shopAdmin.actions.markRefunded')}
                </Button>
            }
        >
            <FormProvider {...methods}>
                <p className="text-sm text-muted-foreground">
                    {t('shopAdmin.order.return.refund.description', { name: orderCode ?? '' })}
                </p>
                <BsInput
                    label={t('shopAdmin.order.return.refund.proofUrl')}
                    name="proofImageUrl"
                    maxLength={URL_MAX_LENGTH}
                />
                <BsTextArea label={t('shopAdmin.order.return.refund.note')} name="note" maxLength={NOTE_MAX_LENGTH} />
            </FormProvider>
        </FormDialogContent>
    )
})

RefundDialog.displayName = 'RefundDialog'
