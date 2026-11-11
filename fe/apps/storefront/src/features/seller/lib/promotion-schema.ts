import type { TFunction } from 'i18next'
import { z } from 'zod'
import {
    MAX_PROMOTION_PERCENT,
    MAX_PROMOTION_PRODUCTS,
    MIN_PROMOTION_PERCENT,
    type SellerPromotion,
    type SellerPromotionRequest,
} from '../types'
import { fromDateTimeLocal, nowDateTimeLocal, toDateTimeLocal } from './dates'

export const buildPromotionSchema = (t: TFunction) =>
    z
        .object({
            name: z.string().trim().min(1, t('seller.validation.nameRequired')).max(150, t('seller.validation.promotionNameMax')),
            discountPercent: z
                .number({ invalid_type_error: t('seller.validation.promotionPercent') })
                .int(t('seller.validation.promotionPercent'))
                .min(MIN_PROMOTION_PERCENT, t('seller.validation.promotionPercent'))
                .max(MAX_PROMOTION_PERCENT, t('seller.validation.promotionPercent')),
            startAt: z.string().min(1, t('seller.validation.startRequired')),
            endAt: z.string().min(1, t('seller.validation.endRequired')),
            status: z.enum(['ACTIVE', 'INACTIVE']),
            productIds: z
                .array(z.string())
                .min(1, t('seller.validation.promotionProducts'))
                .max(MAX_PROMOTION_PRODUCTS, t('seller.validation.promotionProductsMax', { max: MAX_PROMOTION_PRODUCTS })),
        })
        .superRefine((value, ctx) => {
            if (value.startAt && value.endAt && value.endAt <= value.startAt) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endAt'],
                    message: t('seller.validation.endAfterStart'),
                })
            }
        })

export type PromotionFormValues = z.infer<ReturnType<typeof buildPromotionSchema>>

export const emptyPromotionForm = (): PromotionFormValues => ({
    name: '',
    discountPercent: 10,
    startAt: nowDateTimeLocal(0),
    endAt: nowDateTimeLocal(7),
    status: 'ACTIVE',
    productIds: [],
})

export const promotionToForm = (promotion: SellerPromotion): PromotionFormValues => ({
    name: promotion.name,
    discountPercent: promotion.discountPercent,
    startAt: toDateTimeLocal(promotion.startAt),
    endAt: toDateTimeLocal(promotion.endAt),
    status: promotion.status,
    productIds: (promotion.products ?? []).map(product => product.id),
})

export const formToPromotionRequest = (values: PromotionFormValues, id?: string): SellerPromotionRequest => ({
    id,
    name: values.name.trim(),
    discountPercent: values.discountPercent,
    startAt: fromDateTimeLocal(values.startAt),
    endAt: fromDateTimeLocal(values.endAt),
    status: values.status,
    productIds: values.productIds,
})

/** Preview only: mirrors the server rule `round(price * (100 - percent) / 100)` (whole VND, half up). */
export const previewPrice = (price: number, percent: number): number =>
    Math.round((price * (100 - percent)) / 100)

export const isValidPercent = (percent: number): boolean =>
    Number.isInteger(percent) && percent >= MIN_PROMOTION_PERCENT && percent <= MAX_PROMOTION_PERCENT
