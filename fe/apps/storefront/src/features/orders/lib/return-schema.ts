import type { TFunction } from 'i18next'
import { z } from 'zod'
import { MAX_RETURN_IMAGES, RETURN_REASON_CODES, type ReturnRequestBody } from '@/types/shop'

export const BANK_ACCOUNT_REGEX = /^\d{6,30}$/

export const buildReturnSchema = (t: TFunction) =>
    z
        .object({
            reasonCode: z.enum(RETURN_REASON_CODES, {
                errorMap: () => ({ message: t('order.return.validation.reason') }),
            }),
            description: z.string().trim().max(1000, t('order.return.validation.descriptionMax')),
            imageUrls: z
                .array(z.string())
                .min(1, t('order.return.validation.images'))
                .max(MAX_RETURN_IMAGES, t('order.return.validation.images')),
            bankName: z
                .string()
                .trim()
                .min(2, t('order.return.validation.bankName'))
                .max(100, t('order.return.validation.bankName')),
            bankAccountNo: z.string().trim().regex(BANK_ACCOUNT_REGEX, t('order.return.validation.accountNo')),
            bankAccountName: z
                .string()
                .trim()
                .min(2, t('order.return.validation.accountName'))
                .max(100, t('order.return.validation.accountName')),
        })
        .superRefine((value, ctx) => {
            if (value.reasonCode === 'OTHER' && value.description.length < 5) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['description'],
                    message: t('order.return.validation.descriptionOther'),
                })
            }
        })

export type ReturnFormValues = z.infer<ReturnType<typeof buildReturnSchema>>

export const emptyReturnForm = (): ReturnFormValues => ({
    reasonCode: 'DAMAGED',
    description: '',
    imageUrls: [],
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
})

export const formToReturnRequest = (orderId: string, values: ReturnFormValues): ReturnRequestBody => ({
    orderId,
    reasonCode: values.reasonCode,
    description: values.description.trim(),
    imageUrls: values.imageUrls,
    bankName: values.bankName.trim(),
    bankAccountNo: values.bankAccountNo.trim(),
    bankAccountName: values.bankAccountName.trim().toUpperCase(),
})

export const MIN_DISPUTE_REASON = 10
export const isValidDisputeReason = (reason: string): boolean => reason.trim().length >= MIN_DISPUTE_REASON
