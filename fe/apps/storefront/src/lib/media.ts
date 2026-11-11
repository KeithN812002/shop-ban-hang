import { env } from '@/config/env'

/**
 * Backend image URLs may be absolute, already prefixed (`/api/shop/public/file/...`) or the raw
 * configured prefix (`/shop/public/file/...`). Normalise them so the browser always hits our proxy.
 */
export const resolveMediaUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (/^(https?:|data:|blob:)/i.test(url)) return url
    if (url.startsWith(`${env.apiPrefix}/`)) return url
    if (url.startsWith('/')) return `${env.apiPrefix}${url}`
    return `${env.apiPrefix}/${url}`
}

export const splitCsv = (value: string | null | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
