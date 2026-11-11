const IGNORED_KEYS = new Set([
    'pageNumber',
    'pageSize',
    'sortExpr',
    'sorting',
    'fieldName',
    'sortType',
    'refreshTrigger',
    'caseId',
    'moduleCode',
    'excluded',
])

const isEmptyValue = (value: unknown): boolean => {
    if (value === undefined || value === null || value === '') return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') {
        const range = value as { start?: unknown; end?: unknown }
        return !range.start && !range.end
    }
    return false
}

const isSameFilterValue = (a: unknown, b: unknown): boolean => {
    if (isEmptyValue(a) && isEmptyValue(b)) return true
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
        return a.every((item, index) => item === b[index])
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const rangeA = a as { start?: unknown; end?: unknown }
        const rangeB = b as { start?: unknown; end?: unknown }
        return rangeA.start === rangeB.start && rangeA.end === rangeB.end
    }
    return a === b
}

/**
 * True when the user narrowed the list, so an empty result means "no match" rather than "no records".
 * With `defaults` the current filters are compared against the screen's own untouched state; without
 * them any non-empty value counts. Paging, sorting and fixed context keys never count either way.
 */
export const hasActiveFilters = (filters?: object | null, defaults?: object | null): boolean => {
    if (!filters) return false
    const current = filters as Record<string, unknown>
    if (!defaults) {
        return Object.entries(current).some(([key, value]) => !IGNORED_KEYS.has(key) && !isEmptyValue(value))
    }
    const base = defaults as Record<string, unknown>
    const keys = new Set([...Object.keys(current), ...Object.keys(base)])
    return [...keys].some(key => !IGNORED_KEYS.has(key) && !isSameFilterValue(current[key], base[key]))
}

interface TableState {
    pageSize?: number
    fieldName?: string
    sortType?: string
}

export const keepTableState = <T extends TableState>(prev: T, next: T): T => ({
    ...next,
    pageSize: prev.pageSize ?? next.pageSize,
    fieldName: prev.fieldName,
    sortType: prev.sortType,
})

export const keepPageSize = <T extends TableState>(prev: T, defaults: T): T => ({
    ...defaults,
    pageSize: prev.pageSize ?? defaults.pageSize,
})
