import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildRowActions } from '../../components/rowActions'
import {
    ADMIN_CANCELLABLE_ORDER_STATUSES,
    ADMIN_REFUNDABLE_ORDER_STATUS,
    DISPUTED_RETURN_STATUS,
} from '../../constants'
import { formatCount, formatDateTime, formatVnd } from '../../utils/format'
import type { OrderResponse } from '../../types'

interface OrderTableProps {
    rows: OrderResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    /** The list is filtered to disputed returns, so every row can be resolved even if rows carry no `returnStatus`. */
    disputesOnly?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onView: (order: OrderResponse) => void
    onAction: (actionId: string, order: OrderResponse) => void
}

export const OrderTable = memo(({ onView, onAction, disputesOnly, ...tableProps }: OrderTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<OrderResponse>[]>(
        () => [
            { header: t('shopAdmin.order.fields.code'), accessorKey: 'code' },
            {
                header: t('shopAdmin.order.fields.store'),
                accessorKey: 'store',
                enableSorting: false,
                cell: ({ row }) => row.original.store?.name ?? '',
            },
            { header: t('shopAdmin.order.fields.buyer'), accessorKey: 'buyerUsername', enableSorting: false },
            {
                header: t('shopAdmin.order.fields.itemCount'),
                accessorKey: 'itemCount',
                enableSorting: false,
                cell: ({ row }) => formatCount(row.original.itemCount),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.order.fields.total'),
                accessorKey: 'total',
                cell: ({ row }) => formatVnd(row.original.total),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.order.fields.paymentStatus'),
                accessorKey: 'paymentStatus',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="payment" status={row.original.paymentStatus} />,
            },
            {
                header: t('common.status'),
                accessorKey: 'status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="order" status={row.original.status} />,
            },
            {
                header: t('common.audit.createdDate'),
                accessorKey: 'createdDate',
                cell: ({ row }) => formatDateTime(row.original.createdDate),
            },
        ],
        [t],
    )

    const actions = useMemo(
        () =>
            buildRowActions<OrderResponse>(
                [
                    { id: 'view', label: t('common.view'), onClick: onView },
                    {
                        id: 'cancel',
                        label: t('shopAdmin.actions.cancelOrder'),
                        onClick: row => onAction('cancel', row),
                        showWhen: row => ADMIN_CANCELLABLE_ORDER_STATUSES.includes(row.status),
                    },
                    {
                        id: 'confirmReturned',
                        label: t('shopAdmin.actions.confirmReturned'),
                        onClick: row => onAction('confirmReturned', row),
                        showWhen: row => row.status === 'RETURNING',
                    },
                    {
                        id: 'resolveReturn',
                        label: t('shopAdmin.actions.resolveReturn'),
                        onClick: row => onAction('resolveReturn', row),
                        showWhen: row =>
                            row.status === 'RETURN_REQUESTED' &&
                            (row.returnStatus ? row.returnStatus === DISPUTED_RETURN_STATUS : !!disputesOnly),
                    },
                    {
                        id: 'markRefunded',
                        label: t('shopAdmin.actions.markRefunded'),
                        onClick: row => onAction('markRefunded', row),
                        showWhen: row => row.status === ADMIN_REFUNDABLE_ORDER_STATUS,
                    },
                ],
                checkPermission,
            ),
        [t, onView, onAction, disputesOnly, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} />
})

OrderTable.displayName = 'OrderTable'
