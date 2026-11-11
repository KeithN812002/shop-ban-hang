import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategoryTree, searchStores } from '../services/shopAdminService'
import { flattenCategories } from '../utils/category'

export const categoryKeys = {
    all: ['shop-admin', 'category'] as const,
    tree: () => [...categoryKeys.all, 'tree'] as const,
}

export const storeOptionKeys = {
    all: ['shop-admin', 'store-options'] as const,
}

const OPTION_STALE_TIME = 60_000
const STORE_OPTION_LIMIT = 100

/** Category tree flattened depth-first; shared by the category screen and the category pickers. */
export const useCategoryRows = (enabled = true) => {
    const query = useQuery({
        queryKey: categoryKeys.tree(),
        queryFn: async () => flattenCategories(await fetchCategoryTree()),
        enabled,
        staleTime: OPTION_STALE_TIME,
        refetchOnWindowFocus: false,
    })
    return query
}

/** `{ id, name }` options labelled by their full path ("Parent / Child"). */
export const useCategoryOptions = (enabled = true) => {
    const { data, isLoading } = useCategoryRows(enabled)
    const options = useMemo(() => (data ?? []).map(row => ({ id: row.id, name: row.path })), [data])
    return { options, isLoading }
}

/** First page of stores for filter dropdowns (the contract has no lightweight store lookup endpoint). */
export const useStoreOptions = (enabled = true) => {
    const { data, isLoading } = useQuery({
        queryKey: storeOptionKeys.all,
        queryFn: () => searchStores({ pageNumber: 1, pageSize: STORE_OPTION_LIMIT }),
        enabled,
        staleTime: OPTION_STALE_TIME,
        refetchOnWindowFocus: false,
    })
    const options = useMemo(() => (data?.items ?? []).map(store => ({ id: store.id, name: store.name })), [data])
    return { options, isLoading }
}
