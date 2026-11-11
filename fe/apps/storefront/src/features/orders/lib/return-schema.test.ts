import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { buildReturnSchema, emptyReturnForm, formToReturnRequest, isValidDisputeReason } from './return-schema'

const t = ((key: string) => key) as unknown as TFunction
const schema = buildReturnSchema(t)
const valid = {
    ...emptyReturnForm(),
    imageUrls: ['/shop/public/file/a'],
    bankName: 'Vietcombank',
    bankAccountNo: '0123456789',
    bankAccountName: 'Nguyen Van A',
}

const failedPaths = (value: unknown) => {
    const result = schema.safeParse(value)
    return result.success ? [] : result.error.issues.map(issue => issue.path.join('.'))
}

describe('return schema', () => {
    it('accepts a complete form', () => {
        expect(schema.safeParse(valid).success).toBe(true)
    })

    it('requires 1..6 photos', () => {
        expect(failedPaths({ ...valid, imageUrls: [] })).toContain('imageUrls')
        expect(failedPaths({ ...valid, imageUrls: Array.from({ length: 7 }, (_, i) => `/f/${i}`) })).toContain(
            'imageUrls',
        )
        expect(schema.safeParse({ ...valid, imageUrls: Array.from({ length: 6 }, (_, i) => `/f/${i}`) }).success).toBe(
            true,
        )
    })

    it('accepts digits only for the account number', () => {
        expect(failedPaths({ ...valid, bankAccountNo: '12ab56789' })).toContain('bankAccountNo')
        expect(failedPaths({ ...valid, bankAccountNo: '123' })).toContain('bankAccountNo')
        expect(failedPaths({ ...valid, bankAccountNo: '1'.repeat(31) })).toContain('bankAccountNo')
    })

    it('requires bank name and holder', () => {
        expect(failedPaths({ ...valid, bankName: ' ', bankAccountName: '' })).toEqual(
            expect.arrayContaining(['bankName', 'bankAccountName']),
        )
    })

    it('requires a description when the reason is OTHER', () => {
        expect(failedPaths({ ...valid, reasonCode: 'OTHER', description: '' })).toContain('description')
        expect(schema.safeParse({ ...valid, reasonCode: 'OTHER', description: 'Khong dung y' }).success).toBe(true)
    })
})

describe('formToReturnRequest', () => {
    it('trims text and upper-cases the holder name', () => {
        const body = formToReturnRequest('o1', { ...valid, description: '  loi  ', bankAccountName: ' nguyen van a ' })
        expect(body).toMatchObject({ orderId: 'o1', description: 'loi', bankAccountName: 'NGUYEN VAN A' })
    })
})

describe('isValidDisputeReason', () => {
    it('needs a meaningful reason', () => {
        expect(isValidDisputeReason('ngan')).toBe(false)
        expect(isValidDisputeReason('Hang that su bi hu hong')).toBe(true)
    })
})
