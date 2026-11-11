import dayjs from 'dayjs'
import { env } from '@/config/env'

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const COUNT = new Intl.NumberFormat('vi-VN')
const COMPACT = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

export const API_DATE_FORMAT = 'YYYY-MM-DD'

/** Money is VND with no decimals in the UI. */
export const formatVnd = (value?: number | null): string => (value == null ? '' : VND.format(Math.round(value)))
export const formatCount = (value?: number | null): string => (value == null ? '' : COUNT.format(value))
export const formatCompact = (value: number): string => COMPACT.format(value)

export const formatDateTime = (value?: string | null): string => (value ? dayjs(value).format('HH:mm DD/MM/YYYY') : '')
export const formatDate = (value?: string | null): string => (value ? dayjs(value).format('DD/MM/YYYY') : '')

/** Image URLs come back as `public-file-base` paths (`/shop/public/file/...`); make them loadable from the admin origin. */
export const resolveMediaUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
    const base = env.apiBaseUrl.replace(/\/+$/, '')
    return `${base}/${url.replace(/^\/+/, '')}`
}

/** Calendar date picked in a `BsDateRangePicker` -> `fromDate`/`toDate` query value (`YYYY-MM-DD`). */
export const toApiDate = (value?: string | null): string => (value ? value.substring(0, 10) : '')

/** `YYYY-MM-DDTHH:mm` (BsDatePicker with time) -> LocalDateTime string the backend parses. */
export const toLocalDateTime = (value?: string | null): string => {
    if (!value) return ''
    const trimmed = value.length === 16 ? `${value}:00` : value
    return trimmed.substring(0, 19)
}

/** URL slug from a (Vietnamese) name: strips diacritics, lower-cases, joins words with hyphens. */
export const slugify = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
