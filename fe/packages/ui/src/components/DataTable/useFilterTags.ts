import { useCallback, useMemo } from 'react'
import { useFormContext, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form'

export const isFilterValueActive = (value: unknown, defaultValue?: unknown): boolean => {
    if (value === undefined || value === null || value === '') return false
    if (typeof value !== 'object' && value === defaultValue) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object' && !(value instanceof Date)) {
        const range = value as { start?: unknown; end?: unknown }
        return !!range.start || !!range.end
    }
    return true
}

interface TrimmableForm {
    getValues: () => Record<string, unknown>
    setValue: (name: never, value: never) => void
}

export const trimFormStrings = (form: TrimmableForm | null) => {
    if (!form) return
    Object.entries(form.getValues()).forEach(([name, value]) => {
        if (typeof value === 'string' && value !== value.trim()) {
            form.setValue(name as never, value.trim() as never)
        }
    })
}

export interface UseFilterTagsOptions<T extends FieldValues> {
    appliedValues: T | null
    defaultValues: T
    onSearch: (data: T) => void
    advancedKeys?: readonly (keyof T | readonly (keyof T)[])[]
    linkedKeys?: Partial<Record<keyof T, readonly (keyof T)[]>>
    form?: Pick<UseFormReturn<T>, 'reset'>
}

const NO_ADVANCED_KEYS: readonly never[] = []

export const useFilterTags = <T extends FieldValues>({
    appliedValues,
    defaultValues,
    onSearch,
    advancedKeys = NO_ADVANCED_KEYS,
    linkedKeys,
    form,
}: UseFilterTagsOptions<T>) => {
    const formContext = useFormContext<T>()
    const reset = (form ?? formContext).reset

    const activeAdvancedCount = useMemo(() => {
        if (!appliedValues) return 0
        return advancedKeys.filter(entry => {
            const keys = (Array.isArray(entry) ? entry : [entry]) as (keyof T)[]
            return keys.some(key => isFilterValueActive(appliedValues[key], defaultValues[key]))
        }).length
    }, [appliedValues, advancedKeys, defaultValues])

    const removeFilter = useCallback(
        (key: keyof T) => {
            const next = { ...(appliedValues ?? defaultValues) } as T
            for (const k of [key, ...(linkedKeys?.[key] ?? [])]) {
                next[k] = defaultValues[k]
            }
            reset(next as DefaultValues<T>, { keepDefaultValues: true })
            onSearch(next)
        },
        [appliedValues, defaultValues, linkedKeys, reset, onSearch],
    )

    return { activeAdvancedCount, removeFilter }
}
