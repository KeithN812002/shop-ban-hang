import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearch } from '@tanstack/react-router'
import { useMenuLocalizedTitle } from '@/hooks'
import { PENDING_BADGE_QUERY_KEY, type EntityStatus } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import { buildModerationActions } from '../../hooks/moderationActions'
import { useWorkflowActions } from '../../hooks/useWorkflowActions'
import { approveStore, reactivateStore, rejectStore, suspendStore } from '../../services/shopAdminService'
import type { StoreFilterRequest, StoreResponse } from '../../types'
import { storeKeys, useStoreDetail, useStores } from './useStoreQueries'

interface StoreFilterForm {
    keyword: string
}

const DEFAULT_FILTERS: StoreFilterRequest = { pageNumber: 1, pageSize: 20, keyword: '', status: undefined }
const DEFAULT_FORM: StoreFilterForm = { keyword: '' }
const toFilters = (form: StoreFilterForm): Partial<StoreFilterRequest> => ({ keyword: form.keyword.trim() })

const STORE_ACTIONS = buildModerationActions('store', {
    approve: approveStore,
    reject: rejectStore,
    suspend: suspendStore,
    reactivate: reactivateStore,
})
const INVALIDATES = [storeKeys.all, PENDING_BADGE_QUERY_KEY]
const getStoreName = (store: StoreResponse) => store.name

export const useStorePage = () => {
    const { t } = useTranslation()
    // The account screen deep-links here with `?id=<storeId>` to open a store's detail.
    const search = useSearch({ strict: false }) as { id?: string }
    const [detailId, setDetailId] = useState<string | null>(search.id ?? null)

    const paged = usePagedFilters<StoreFilterForm, StoreFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
    })
    const { setFilters } = paged

    const storesQuery = useStores(paged.filters)
    const detailQuery = useStoreDetail(detailId)
    const workflow = useWorkflowActions<StoreResponse>({
        actions: STORE_ACTIONS,
        getName: getStoreName,
        invalidates: INVALIDATES,
    })

    const title = useMenuLocalizedTitle()

    const handleStatusChange = useCallback(
        (status?: string) =>
            setFilters(prev => ({ ...prev, status: status as EntityStatus | undefined, pageNumber: 1 })),
        [setFilters],
    )
    const handleView = useCallback((store: StoreResponse) => setDetailId(store.id), [])
    const handleCloseDetail = useCallback(() => setDetailId(null), [])
    const handleDetailAction = useCallback(
        (actionId: string, store: StoreResponse) => {
            setDetailId(null)
            workflow.run(actionId, store)
        },
        [workflow],
    )

    return {
        t,
        title,
        finalLoading: storesQuery.isFetching || workflow.isPending,
        selectedStatus: paged.filters.status,
        onStatusChange: handleStatusChange,
        filterProps: useMemo(
            () => ({ methods: paged.methods, onSearch: paged.onSearch, onReset: paged.onReset }),
            [paged.methods, paged.onSearch, paged.onReset],
        ),
        tableProps: {
            ...toTableProps(storesQuery, paged),
            onView: handleView,
            onAction: workflow.run,
        },
        detailProps: {
            isOpen: !!detailId,
            isLoading: detailQuery.isLoading,
            store: detailQuery.data,
            onClose: handleCloseDetail,
            onAction: handleDetailAction,
        },
        reasonDialogProps: workflow.reasonDialogProps,
    }
}
