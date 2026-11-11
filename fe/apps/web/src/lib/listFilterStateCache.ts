export interface ListFilterStateEntry<TFilter, TForm> {
    filters: TFilter
    formValues: TForm
    appliedValues?: TForm | null
}

const cache = new Map<string, ListFilterStateEntry<unknown, unknown>>()

export const saveListFilterState = <TFilter, TForm>(key: string, entry: ListFilterStateEntry<TFilter, TForm>) => {
    cache.set(key, entry as ListFilterStateEntry<unknown, unknown>)
}

export const readListFilterState = <TFilter, TForm>(key: string) =>
    cache.get(key) as ListFilterStateEntry<TFilter, TForm> | undefined

export const clearListFilterState = () => {
    cache.clear()
}
