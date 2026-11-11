import type { ColumnPinningState, ColumnSizingState, VisibilityState } from '@tanstack/react-table'

export interface StoredColumnSettings {
    order: string[]
    visibility: VisibilityState
    pinning: ColumnPinningState
    sizing: ColumnSizingState
}

export type TableDensity = 'compact' | 'normal' | 'comfortable'

const KEY_PREFIX = 'datatable_columns:'
const DENSITY_KEY = 'datatable_density'
const DENSITIES: TableDensity[] = ['compact', 'normal', 'comfortable']

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string')

export const readColumnSettings = (key: string): StoredColumnSettings | null => {
    try {
        const raw = localStorage.getItem(KEY_PREFIX + key)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || !isStringArray(parsed.order) || typeof parsed.visibility !== 'object') return null
        return {
            order: parsed.order,
            visibility: parsed.visibility ?? {},
            pinning: {
                left: isStringArray(parsed.pinning?.left) ? parsed.pinning.left : [],
                right: isStringArray(parsed.pinning?.right) ? parsed.pinning.right : [],
            },
            sizing: parsed.sizing && typeof parsed.sizing === 'object' ? parsed.sizing : {},
        }
    } catch {
        return null
    }
}

export const writeColumnSettings = (key: string, settings: StoredColumnSettings): void => {
    try {
        localStorage.setItem(KEY_PREFIX + key, JSON.stringify(settings))
    } catch {
        // Storage may be unavailable (private mode, quota); settings then last for the session only.
    }
}

export const clearColumnSettings = (key: string): void => {
    try {
        localStorage.removeItem(KEY_PREFIX + key)
    } catch {
        // Ignore unavailable storage.
    }
}

export const readTableDensity = (): TableDensity => {
    try {
        const value = localStorage.getItem(DENSITY_KEY) as TableDensity | null
        return value && DENSITIES.includes(value) ? value : 'normal'
    } catch {
        return 'normal'
    }
}

export const writeTableDensity = (density: TableDensity): void => {
    try {
        localStorage.setItem(DENSITY_KEY, density)
    } catch {
        // Ignore unavailable storage.
    }
}
