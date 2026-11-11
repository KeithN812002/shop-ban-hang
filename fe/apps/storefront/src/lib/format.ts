const vndFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
})

/** Money: VND, no decimals (contract §2). */
export const formatPrice = (value: number | null | undefined): string => vndFormatter.format(value ?? 0)

const numberFormatter = new Intl.NumberFormat('vi-VN')
export const formatNumber = (value: number | null | undefined): string => numberFormatter.format(value ?? 0)

/** 1200 -> "1,2k", 15300 -> "15,3k"; used for sold counts. */
export const formatCompact = (value: number | null | undefined): string => {
    const n = value ?? 0
    if (n < 1000) return String(n)
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(n / 1000)}k`
}

const toDate = (iso: string | null | undefined): Date | null => {
    if (!iso) return null
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? null : date
}

export const formatDateTime = (iso: string | null | undefined, locale = 'vi-VN'): string => {
    const date = toDate(iso)
    if (!date) return ''
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export const formatDate = (iso: string | null | undefined, locale = 'vi-VN'): string => {
    const date = toDate(iso)
    if (!date) return ''
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export const toApiLocale = (language: string | undefined): string => (language?.startsWith('en') ? 'en-US' : 'vi-VN')

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
