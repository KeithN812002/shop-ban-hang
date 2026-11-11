import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearch } from '@tanstack/react-router'
import { useMenuLocalizedTitle } from '@/hooks'
import { PENDING_BADGE_QUERY_KEY, type EntityStatus } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import { buildModerationActions } from '../../hooks/moderationActions'
import { useWorkflowActions } from '../../hooks/useWorkflowActions'
import { approveShipper, reactivateShipper, rejectShipper, suspendShipper } from '../../services/shopAdminService'
import type { ShipperFilterRequest, ShipperResponse } from '../../types'
import { shipperKeys, useShippers } from './useShipperQueries'

interface ShipperFilterForm {
    keyword: string
}

const DEFAULT_FILTERS: ShipperFilterRequest = { pageNumber: 1, pageSize: 20, keyword: '', status: undefined }
const DEFAULT_FORM: ShipperFilterForm = { keyword: '' }
const toFilters = (form: ShipperFilterForm): Partial<ShipperFilterRequest> => ({ keyword: form.keyword.trim() })

const SHIPPER_ACTIONS = buildModerationActions('shipper', {
    approve: approveShipper,
    reject: rejectShipper,
    suspend: suspendShipper,
    reactivate: reactivateShipper,
})
const INVALIDATES = [shipperKeys.all, PENDING_BADGE_QUERY_KEY]
const getShipperName = (shipper: ShipperResponse) => shipper.fullName || shipper.username

export const useShipperPage = () => {
    const { t } = useTranslation()
    // The account screen deep-links here with `?keyword=<username>`.
    const search = useSearch({ strict: false }) as { keyword?: string }
    const initialKeyword = typeof search.keyword === 'string' ? search.keyword : ''

    const paged = usePagedFilters<ShipperFilterForm, ShipperFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
        initialFilters: initialKeyword ? { keyword: initialKeyword } : undefined,
        initialForm: initialKeyword ? { keyword: initialKeyword } : undefined,
    })
    const { setFilters } = paged
    const [detail, setDetail] = useState<ShipperResponse | null>(null)

    const shippersQuery = useShippers(paged.filters)
    const workflow = useWorkflowActions<ShipperResponse>({
        actions: SHIPPER_ACTIONS,
        getName: getShipperName,
        invalidates: INVALIDATES,
    })

    const title = useMenuLocalizedTitle()

    const handleStatusChange = useCallback(
        (status?: string) =>
            setFilters(prev => ({ ...prev, status: status as EntityStatus | undefined, pageNumber: 1 })),
        [setFilters],
    )
    const handleCloseDetail = useCallback(() => setDetail(null), [])
    const handleDetailAction = useCallback(
        (actionId: string, shipper: ShipperResponse) => {
            setDetail(null)
            workflow.run(actionId, shipper)
        },
        [workflow],
    )

    return {
        t,
        title,
        finalLoading: shippersQuery.isFetching || workflow.isPending,
        selectedStatus: paged.filters.status,
        onStatusChange: handleStatusChange,
        filterProps: useMemo(
            () => ({ methods: paged.methods, onSearch: paged.onSearch, onReset: paged.onReset }),
            [paged.methods, paged.onSearch, paged.onReset],
        ),
        tableProps: {
            ...toTableProps(shippersQuery, paged),
            onView: setDetail,
            onAction: workflow.run,
        },
        detailProps: {
            isOpen: !!detail,
            shipper: detail ?? undefined,
            onClose: handleCloseDetail,
            onAction: handleDetailAction,
        },
        reasonDialogProps: workflow.reasonDialogProps,
    }
}
