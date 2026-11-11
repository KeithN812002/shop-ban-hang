import type { TFunction } from 'i18next'
import { z } from 'zod'
import { splitCsv } from '@/lib/media'
import type { ArType } from '@/types/shop'
import { AR_TYPES, EDITABLE_PRODUCT_STATUSES, MAX_PRODUCT_IMAGES } from '../constants'
import type { EditableProductStatus, SellerProductDetail, SellerProductRequest } from '../types'

const arTypeSchema = z.enum(AR_TYPES as [ArType, ...ArType[]])
const statusSchema = z.enum(EDITABLE_PRODUCT_STATUSES as [EditableProductStatus, ...EditableProductStatus[]])

export const AR_SCALE_RANGE = { min: 0.3, max: 3, step: 0.05, fallback: 1 } as const
export const AR_OFFSET_RANGE = { min: -1, max: 1, step: 0.01, fallback: 0 } as const
export const MAX_TAGS = 10

/** Schema factory: messages are resolved through i18n at build time. */
export const buildProductSchema = (t: TFunction) => {
    const money = (key: string) =>
        z
            .number({ invalid_type_error: t(key) })
            .int(t('seller.validation.integer'))
            .min(1, t(key))
    return z
        .object({
            categoryId: z.string().min(1, t('seller.validation.categoryRequired')),
            name: z
                .string()
                .trim()
                .min(3, t('seller.validation.nameMin'))
                .max(255, t('seller.validation.nameMax')),
            description: z.string().max(5000, t('seller.validation.descriptionMax')),
            price: money('seller.validation.priceRequired'),
            originalPrice: z
                .number({ invalid_type_error: t('seller.validation.priceRequired') })
                .int(t('seller.validation.integer'))
                .min(1, t('seller.validation.priceRequired'))
                .nullable(),
            stock: z
                .number({ invalid_type_error: t('seller.validation.stockInvalid') })
                .int(t('seller.validation.integer'))
                .min(0, t('seller.validation.stockInvalid')),
            images: z
                .array(z.string())
                .min(1, t('seller.validation.imagesRequired'))
                .max(MAX_PRODUCT_IMAGES, t('seller.validation.imagesMax', { max: MAX_PRODUCT_IMAGES })),
            variants: z.array(
                z.object({
                    id: z.string().optional(),
                    name: z.string().trim().min(1, t('seller.validation.variantName')).max(100),
                    price: money('seller.validation.priceRequired'),
                    stock: z
                        .number({ invalid_type_error: t('seller.validation.stockInvalid') })
                        .int(t('seller.validation.integer'))
                        .min(0, t('seller.validation.stockInvalid')),
                    sku: z.string().trim().max(64, t('seller.validation.skuMax')),
                }),
            ),
            tags: z.string().max(500, t('seller.validation.tagsMax')),
            status: statusSchema,
            arType: arTypeSchema,
            arOverlayUrl: z.string().nullable(),
            arScale: z.number().min(AR_SCALE_RANGE.min).max(AR_SCALE_RANGE.max),
            arOffsetY: z.number().min(AR_OFFSET_RANGE.min).max(AR_OFFSET_RANGE.max),
        })
        .superRefine((value, ctx) => {
            if (value.originalPrice !== null && value.originalPrice < value.price) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['originalPrice'],
                    message: t('seller.validation.originalPriceLow'),
                })
            }
            if (value.arType !== 'NONE' && !value.arOverlayUrl) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['arOverlayUrl'],
                    message: t('seller.validation.overlayRequired'),
                })
            }
            const tagCount = parseTags(value.tags).length
            if (tagCount > MAX_TAGS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['tags'],
                    message: t('seller.validation.tagsCount', { max: MAX_TAGS }),
                })
            }
        })
}

export type ProductFormValues = z.infer<ReturnType<typeof buildProductSchema>>

export const parseTags = (raw: string): string[] => [...new Set(splitCsv(raw))]

export const emptyProductForm = (): ProductFormValues => ({
    categoryId: '',
    name: '',
    description: '',
    price: Number.NaN,
    originalPrice: null,
    stock: 0,
    images: [],
    variants: [],
    tags: '',
    status: 'ACTIVE',
    arType: 'NONE',
    arOverlayUrl: null,
    arScale: AR_SCALE_RANGE.fallback,
    arOffsetY: AR_OFFSET_RANGE.fallback,
})

export const detailToForm = (detail: SellerProductDetail): ProductFormValues => ({
    categoryId: detail.categoryId ?? '',
    name: detail.name,
    description: detail.description ?? '',
    price: detail.price,
    originalPrice: detail.originalPrice,
    stock: detail.stock,
    images: detail.images ?? [],
    variants: (detail.variants ?? []).map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku ?? '',
    })),
    tags: Array.isArray(detail.tags) ? detail.tags.join(', ') : splitCsv(detail.tags).join(', '),
    // BANNED products render read-only, so the placeholder status is never submitted.
    status: detail.status === 'BANNED' ? 'HIDDEN' : detail.status,
    arType: detail.arType ?? 'NONE',
    arOverlayUrl: detail.arOverlayUrl,
    arScale: detail.arScale ?? AR_SCALE_RANGE.fallback,
    arOffsetY: detail.arOffsetY ?? AR_OFFSET_RANGE.fallback,
})

export const variantStockSum = (variants: ProductFormValues['variants']): number =>
    variants.reduce((sum, variant) => sum + (Number.isFinite(variant.stock) ? variant.stock : 0), 0)

export const formToRequest = (values: ProductFormValues, id?: string): SellerProductRequest => {
    const hasVariants = values.variants.length > 0
    const hasAr = values.arType !== 'NONE'
    return {
        id,
        categoryId: values.categoryId,
        name: values.name.trim(),
        description: values.description.trim(),
        price: values.price,
        originalPrice: values.originalPrice,
        // The server derives the same sum; sending it keeps the payload self-consistent.
        stock: hasVariants ? variantStockSum(values.variants) : values.stock,
        images: values.images,
        variants: values.variants.map(variant => ({ ...variant, name: variant.name.trim(), sku: variant.sku.trim() })),
        tags: parseTags(values.tags),
        status: values.status,
        arType: values.arType,
        arOverlayUrl: hasAr ? values.arOverlayUrl : null,
        arScale: values.arScale,
        arOffsetY: values.arOffsetY,
    }
}
