import { memo, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsNumberField } from '@workspace/ui/components/Numberfield'
import { BsDatePicker } from '@workspace/ui/components/DatePicker'
import { ActionButton } from '@/components/Common/ActionButton'
import { useDialogTitle } from '@/hooks'
import { ACTIVE_STATUS_OPTIONS, ACTIVE_STATUSES, DISCOUNT_TYPE_OPTIONS, DISCOUNT_TYPES } from '../../constants'
import { toLocalDateTime } from '../../utils/format'
import { zodFormResolver } from '../../utils/zodResolver'
import type { VoucherRequest, VoucherResponse } from '../../types'

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/
const CODE_MAX_LENGTH = 50
const NAME_MAX_LENGTH = 200
const MAX_PERCENT = 100
/** `YYYY-MM-DDTHH:mm`, the value shape of `BsDatePicker` with time. */
const DATE_TIME_LENGTH = 16

interface VoucherFormValues {
    code: string
    name: string
    discountType: string
    discountValue: number | null
    maxDiscount: number | null
    minOrderValue: number | null
    startAt: string
    endAt: string
    usageLimit: number | null
    perUserLimit: number | null
    status: string
}

const DEFAULT_VALUES: VoucherFormValues = {
    code: '',
    name: '',
    discountType: 'PERCENT',
    discountValue: null,
    maxDiscount: null,
    minOrderValue: null,
    startAt: '',
    endAt: '',
    usageLimit: null,
    perUserLimit: null,
    status: 'ACTIVE',
}

const buildSchema = (t: TFunction) => {
    const required = (label: string) => t('forms.validation.required', { label })
    const label = {
        code: t('shopAdmin.voucher.fields.code'),
        name: t('shopAdmin.voucher.fields.name'),
        discountValue: t('shopAdmin.voucher.fields.discountValue'),
        maxDiscount: t('shopAdmin.voucher.fields.maxDiscount'),
        minOrderValue: t('shopAdmin.voucher.fields.minOrderValue'),
        startAt: t('shopAdmin.voucher.fields.startAt'),
        endAt: t('shopAdmin.voucher.fields.endAt'),
        usageLimit: t('shopAdmin.voucher.fields.usageLimit'),
        perUserLimit: t('shopAdmin.voucher.fields.perUserLimit'),
    }
    const optionalMoney = (name: string) =>
        z
            .number()
            .min(0, t('forms.validation.min', { label: name, min: 0 }))
            .nullable()
    const optionalCount = (name: string) =>
        z
            .number()
            .int(t('forms.validation.integer', { label: name }))
            .min(1, t('forms.validation.min', { label: name, min: 1 }))
            .nullable()

    return z
        .object({
            code: z
                .string()
                .trim()
                .min(1, required(label.code))
                .max(CODE_MAX_LENGTH, t('forms.validation.maxLength', { label: label.code, max: CODE_MAX_LENGTH }))
                .regex(CODE_PATTERN, t('shopAdmin.voucher.errors.codeFormat'))
                .transform(value => value.toUpperCase()),
            name: z
                .string()
                .trim()
                .min(1, required(label.name))
                .max(NAME_MAX_LENGTH, t('forms.validation.maxLength', { label: label.name, max: NAME_MAX_LENGTH })),
            discountType: z.enum(DISCOUNT_TYPES),
            discountValue: z
                .number({
                    required_error: required(label.discountValue),
                    invalid_type_error: required(label.discountValue),
                })
                .positive(t('shopAdmin.voucher.errors.discountPositive')),
            maxDiscount: optionalMoney(label.maxDiscount),
            minOrderValue: optionalMoney(label.minOrderValue),
            startAt: z.string().min(1, required(label.startAt)),
            endAt: z.string().min(1, required(label.endAt)),
            usageLimit: optionalCount(label.usageLimit),
            perUserLimit: optionalCount(label.perUserLimit),
            status: z.enum(ACTIVE_STATUSES),
        })
        .superRefine((value, ctx) => {
            if (value.discountType === 'PERCENT' && value.discountValue > MAX_PERCENT) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['discountValue'],
                    message: t('shopAdmin.voucher.errors.percentMax', { max: MAX_PERCENT }),
                })
            }
            if (value.startAt && value.endAt && value.endAt <= value.startAt) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endAt'],
                    message: t('shopAdmin.voucher.errors.endAfterStart'),
                })
            }
        })
}

type VoucherFormOutput = z.output<ReturnType<typeof buildSchema>>

const toFormValues = (voucher?: VoucherResponse): VoucherFormValues =>
    voucher
        ? {
              code: voucher.code,
              name: voucher.name,
              discountType: voucher.discountType,
              discountValue: voucher.discountValue,
              maxDiscount: voucher.maxDiscount ?? null,
              minOrderValue: voucher.minOrderValue ?? null,
              startAt: voucher.startAt.substring(0, DATE_TIME_LENGTH),
              endAt: voucher.endAt.substring(0, DATE_TIME_LENGTH),
              usageLimit: voucher.usageLimit ?? null,
              perUserLimit: voucher.perUserLimit ?? null,
              status: voucher.status,
          }
        : DEFAULT_VALUES

interface VoucherFormDialogProps {
    isOpen: boolean
    voucher?: VoucherResponse
    isPending?: boolean
    onClose: () => void
    onSubmit: (data: VoucherRequest) => Promise<void>
}

export const VoucherFormDialog = memo(({ isOpen, voucher, isPending, onClose, onSubmit }: VoucherFormDialogProps) => {
    const { t } = useTranslation()
    const dialogTitle = useDialogTitle()
    const schema = useMemo(() => buildSchema(t), [t])
    const methods = useForm<VoucherFormValues, unknown, VoucherFormOutput>({
        defaultValues: DEFAULT_VALUES,
        resolver: zodFormResolver<VoucherFormValues, VoucherFormOutput>(schema),
    })
    const { handleSubmit, reset, watch } = methods
    const isEdit = !!voucher
    const isPercent = watch('discountType') === 'PERCENT'

    useEffect(() => {
        if (isOpen) reset(toFormValues(voucher))
    }, [isOpen, voucher, reset])

    const submit = handleSubmit(async values => {
        await onSubmit({
            id: voucher?.id,
            code: values.code,
            name: values.name,
            discountType: values.discountType,
            discountValue: values.discountValue,
            maxDiscount: values.discountType === 'PERCENT' ? values.maxDiscount : null,
            minOrderValue: values.minOrderValue,
            startAt: toLocalDateTime(values.startAt),
            endAt: toLocalDateTime(values.endAt),
            usageLimit: values.usageLimit,
            perUserLimit: values.perUserLimit,
            status: values.status,
        })
    })

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={onClose}
            onSave={submit}
            isPending={isPending}
            title={dialogTitle(isEdit ? 'edit' : 'create')}
            t={t}
            columns={2}
            className="max-w-3xl"
            footer={
                <ActionButton
                    type="submit"
                    actionType={isEdit ? 'update' : 'create'}
                    actionCode={isEdit ? 'update' : 'create'}
                    isDisabled={isPending}
                />
            }
        >
            <FormProvider {...methods}>
                <BsInput
                    label={t('shopAdmin.voucher.fields.code')}
                    name="code"
                    isRequired
                    maxLength={CODE_MAX_LENGTH}
                    isDisabled={isEdit}
                    autoFocus={!isEdit}
                />
                <BsInput
                    label={t('shopAdmin.voucher.fields.name')}
                    name="name"
                    isRequired
                    maxLength={NAME_MAX_LENGTH}
                />
                <BsSelect
                    label={t('shopAdmin.voucher.fields.discountType')}
                    name="discountType"
                    options={DISCOUNT_TYPE_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    isRequired
                />
                <BsNumberField
                    label={t('shopAdmin.voucher.fields.discountValue')}
                    name="discountValue"
                    isRequired
                    minValue={0}
                    showStepper={false}
                />
                <BsNumberField
                    label={t('shopAdmin.voucher.fields.maxDiscount')}
                    name="maxDiscount"
                    minValue={0}
                    showStepper={false}
                    isDisabled={!isPercent}
                />
                <BsNumberField
                    label={t('shopAdmin.voucher.fields.minOrderValue')}
                    name="minOrderValue"
                    minValue={0}
                    showStepper={false}
                />
                <BsDatePicker label={t('shopAdmin.voucher.fields.startAt')} name="startAt" showTime isRequired />
                <BsDatePicker label={t('shopAdmin.voucher.fields.endAt')} name="endAt" showTime isRequired />
                <BsNumberField
                    label={t('shopAdmin.voucher.fields.usageLimit')}
                    name="usageLimit"
                    minValue={1}
                    showStepper={false}
                />
                <BsNumberField
                    label={t('shopAdmin.voucher.fields.perUserLimit')}
                    name="perUserLimit"
                    minValue={1}
                    showStepper={false}
                />
                <BsSelect
                    label={t('common.status')}
                    name="status"
                    options={ACTIVE_STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    isRequired
                />
            </FormProvider>
        </FormDialogContent>
    )
})

VoucherFormDialog.displayName = 'VoucherFormDialog'
