import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2, X } from 'lucide-react'
import { useMenuLocalizedTitle } from '@/hooks'
import { DISPUTED_RETURN_STATUS, type OrderStatus } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import { useStoreOptions } from '../../hooks/useCatalogQueries'
import { useWorkflowActions, type WorkflowAction } from '../../hooks/useWorkflowActions'
import { cancelOrder, confirmReturnedOrder } from '../../services/shopAdminService'
import type { OrderFilterRequest, OrderResponse } from '../../types'
import { toApiDate } from '../../utils/format'
import { orderKeys, useOrderDetail, useOrders } from './useOrderQueries'
import { RETURN_ACTION_IDS, useReturnActions } from './useReturnActions'

export interface OrderFilterForm {
    keyword: string
    status: string | null
    storeId: string | null
    dateRange?: { start?: string; end?: string } | null
}

const DEFAULT_FILTERS: OrderFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    keyword: '',
    status: undefined,
    storeId: undefined,
    fromDate: '',
    toDate: '',
}
const DEFAULT_FORM: OrderFilterForm = {
    keyword: '',
    status: null,
    storeId: null,
    dateRange: { start: undefined, end: undefined },
}
const toFilters = (form: OrderFilterForm): Partial<OrderFilterRequest> => ({
    keyword: form.keyword.trim(),
    status: (form.status as OrderStatus | null) ?? undefined,
    storeId: form.storeId ?? undefined,
    fromDate: toApiDate(form.dateRange?.start),
    toDate: toApiDate(form.dateRange?.end),
})

const ORDER_ACTIONS: WorkflowAction[] = [
    {
        id: 'cancel',
        icon: X,
        variant: 'destructive',
        withReason: true,
        execute: cancelOrder,
        confirmTitle: 'shopAdmin.order.confirm.cancelTitle',
        confirmDescription: 'shopAdmin.order.confirm.cancel',
        confirmLabel: 'shopAdmin.actions.cancelOrder',
        successMessage: 'shopAdmin.order.messages.cancelSuccess',
    },
    {
        id: 'confirmReturned',
        icon: Undo2,
        confirmTitle: 'shopAdmin.order.confirm.confirmReturnedTitle',
        confirmDescription: 'shopAdmin.order.confirm.confirmReturned',
        confirmLabel: 'shopAdmin.actions.confirmReturned',
        successMessage: 'shopAdmin.order.messages.confirmReturnedSuccess',
        execute: confirmReturnedOrder,
    },
]
const INVALIDATES = [orderKeys.all]
const getOrderCode = (order: OrderResponse) => order.code

export const useOrderPage = () => {
    const { t } = useTranslation()
    const [detailId, setDetailId] = useState<string | null>(null)
    const [disputesOnly, setDisputesOnly] = useState(false)

    const paged = usePagedFilters<OrderFilterForm, OrderFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
    })

    const queryFilters = useMemo<OrderFilterRequest>(
        () => (disputesOnly ? { ...paged.filters, returnStatus: DISPUTED_RETURN_STATUS } : paged.filters),
        [paged.filters, disputesOnly],
    )
    const ordersQuery = useOrders(queryFilters)
    const detailQuery = useOrderDetail(detailId)
    const { options: storeOptions } = useStoreOptions()
    const workflow = useWorkflowActions<OrderResponse>({
        actions: ORDER_ACTIONS,
        getName: getOrderCode,
        invalidates: INVALIDATES,
    })

    const returnActions = useReturnActions()
    const title = useMenuLocalizedTitle()

    const { onPageChange } = paged
    const handleReturnTabChange = useCallback(
        (value?: string) => {
            setDisputesOnly(value === DISPUTED_RETURN_STATUS)
            onPageChange(1)
        },
        [onPageChange],
    )
    const { run: runWorkflow } = workflow
    const { open: openReturnAction } = returnActions
    const handleAction = useCallback(
        (actionId: string, order: OrderResponse) =>
            RETURN_ACTION_IDS.has(actionId) ? openReturnAction(actionId, order) : runWorkflow(actionId, order),
        [openReturnAction, runWorkflow],
    )

    const handleView = useCallback((order: OrderResponse) => setDetailId(order.id), [])
    const handleCloseDetail = useCallback(() => setDetailId(null), [])
    const handleDetailAction = useCallback(
        (actionId: string, order: OrderResponse) => {
            setDetailId(null)
            handleAction(actionId, order)
        },
        [handleAction],
    )

    return {
        t,
        title,
        finalLoading: ordersQuery.isFetching || workflow.isPending || returnActions.isPending,
        selectedReturnStatus: disputesOnly ? DISPUTED_RETURN_STATUS : undefined,
        onReturnStatusChange: handleReturnTabChange,
        filterProps: useMemo(
            () => ({ methods: paged.methods, onSearch: paged.onSearch, onReset: paged.onReset, storeOptions }),
            [paged.methods, paged.onSearch, paged.onReset, storeOptions],
        ),
        tableProps: {
            ...toTableProps(ordersQuery, paged),
            hasActiveFilter: paged.hasActiveFilter || disputesOnly,
            disputesOnly,
            onView: handleView,
            onAction: handleAction,
        },
        detailProps: {
            isOpen: !!detailId,
            isLoading: detailQuery.isLoading,
            order: detailQuery.data,
            onClose: handleCloseDetail,
            onAction: handleDetailAction,
        },
        reasonDialogProps: workflow.reasonDialogProps,
        resolveReturnDialogProps: returnActions.resolveDialogProps,
        refundDialogProps: returnActions.refundDialogProps,
    }
}
