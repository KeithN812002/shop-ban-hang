import type { TFunction } from 'i18next'
import { z } from 'zod'
import { fromDateTimeLocal, nowDateTimeLocal, toDateTimeLocal } from './dates'
import type { SellerVoucher, SellerVoucherRequest } from '../types'

const positiveInt = (message: string) =>
    z.number({ invalid_type_error: message }).int(message).min(1, message)

export const buildVoucherSchema = (t: TFunction) =>
    z
        .object({
            code: z
                .string()
                .trim()
                .min(3, t('seller.validation.codeLength'))
                .max(32, t('seller.validation.codeLength'))
                .regex(/^[A-Za-z0-9_-]+$/, t('seller.validation.codeChars')),
            name: z.string().trim().min(1, t('seller.validation.nameRequired')).max(100, t('seller.validation.nameMax')),
            discountType: z.enum(['PERCENT', 'FIXED']),
            discountValue: positiveInt(t('seller.validation.discountValue')),
            maxDiscount: positiveInt(t('seller.validation.maxDiscount')).nullable(),
            minOrderValue: z
                .number({ invalid_type_error: t('seller.validation.minOrder') })
                .int(t('seller.validation.minOrder'))
                .min(0, t('seller.validation.minOrder'))
                .nullable(),
            startAt: z.string().min(1, t('seller.validation.startRequired')),
            endAt: z.string().min(1, t('seller.validation.endRequired')),
            usageLimit: positiveInt(t('seller.validation.usageLimit')).nullable(),
            perUserLimit: positiveInt(t('seller.validation.perUserLimit')).nullable(),
            status: z.enum(['ACTIVE', 'INACTIVE']),
        })
        .superRefine((value, ctx) => {
            if (value.discountType === 'PERCENT' && value.discountValue > 100) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['discountValue'],
                    message: t('seller.validation.percentMax'),
                })
            }
            if (value.startAt && value.endAt && value.endAt <= value.startAt) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endAt'],
                    message: t('seller.validation.endAfterStart'),
                })
            }
            if (value.usageLimit !== null && value.perUserLimit !== null && value.perUserLimit > value.usageLimit) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['perUserLimit'],
                    message: t('seller.validation.perUserOverTotal'),
                })
            }
        })

export type VoucherFormValues = z.infer<ReturnType<typeof buildVoucherSchema>>

export const emptyVoucherForm = (): VoucherFormValues => ({
    code: '',
    name: '',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscount: null,
    minOrderValue: null,
    startAt: nowDateTimeLocal(0),
    endAt: nowDateTimeLocal(30),
    usageLimit: null,
    perUserLimit: 1,
    status: 'ACTIVE',
})

export const voucherToForm = (voucher: SellerVoucher): VoucherFormValues => ({
    code: voucher.code,
    name: voucher.name,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    maxDiscount: voucher.maxDiscount,
    minOrderValue: voucher.minOrderValue,
    startAt: toDateTimeLocal(voucher.startAt),
    endAt: toDateTimeLocal(voucher.endAt),
    usageLimit: voucher.usageLimit,
    perUserLimit: voucher.perUserLimit,
    status: voucher.status,
})

export const formToVoucherRequest = (values: VoucherFormValues, id?: string): SellerVoucherRequest => ({
    id,
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    discountType: values.discountType,
    discountValue: values.discountValue,
    // A cap only makes sense for percentage discounts.
    maxDiscount: values.discountType === 'PERCENT' ? values.maxDiscount : null,
    minOrderValue: values.minOrderValue,
    startAt: fromDateTimeLocal(values.startAt),
    endAt: fromDateTimeLocal(values.endAt),
    usageLimit: values.usageLimit,
    perUserLimit: values.perUserLimit,
    status: values.status,
})
