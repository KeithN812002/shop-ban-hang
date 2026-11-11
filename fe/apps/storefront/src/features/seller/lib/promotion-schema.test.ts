import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { buildPromotionSchema, emptyPromotionForm, formToPromotionRequest, isValidPercent, previewPrice } from './promotion-schema'

const t = ((key: string) => key) as unknown as TFunction
const schema = buildPromotionSchema(t)
const valid = { ...emptyPromotionForm(), name: 'Sale', productIds: ['p1'] }

describe('previewPrice', () => {
    it('applies the percent and rounds half up to whole VND', () => {
        expect(previewPrice(100_000, 10)).toBe(90_000)
        expect(previewPrice(99_999, 15)).toBe(84_999)
        expect(previewPrice(105, 50)).toBe(53)
    })
})

describe('isValidPercent', () => {
    it('accepts 1..90 integers only', () => {
        expect(isValidPercent(1)).toBe(true)
        expect(isValidPercent(90)).toBe(true)
        expect(isValidPercent(0)).toBe(false)
        expect(isValidPercent(91)).toBe(false)
        expect(isValidPercent(10.5)).toBe(false)
        expect(isValidPercent(Number.NaN)).toBe(false)
    })
})

describe('promotion schema', () => {
    it('accepts a complete form', () => {
        expect(schema.safeParse(valid).success).toBe(true)
    })

    it('rejects out-of-range percent, no products and end before start', () => {
        expect(schema.safeParse({ ...valid, discountPercent: 91 }).success).toBe(false)
        expect(schema.safeParse({ ...valid, productIds: [] }).success).toBe(false)
        expect(schema.safeParse({ ...valid, startAt: '2030-01-02T10:00', endAt: '2030-01-01T10:00' }).success).toBe(false)
    })
})

describe('formToPromotionRequest', () => {
    it('sends LocalDateTime with seconds and the trimmed name', () => {
        const request = formToPromotionRequest(
            { ...valid, name: '  Sale  ', startAt: '2030-01-01T08:00', endAt: '2030-01-02T08:30' },
            'id-1',
        )
        expect(request).toMatchObject({
            id: 'id-1',
            name: 'Sale',
            startAt: '2030-01-01T08:00:00',
            endAt: '2030-01-02T08:30:00',
            productIds: ['p1'],
        })
    })
})
