import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildRowActions } from '../../components/rowActions'
import { formatCount, formatDateTime, formatVnd } from '../../utils/format'
import type { VoucherResponse } from '../../types'

interface VoucherTableProps {
    rows: VoucherResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onEdit: (voucher: VoucherResponse) => void
    onDelete: (voucher: VoucherResponse) => void
}

const formatDiscount = (voucher: VoucherResponse): string =>
    voucher.discountType === 'PERCENT' ? `${voucher.discountValue}%` : formatVnd(voucher.discountValue)

export const VoucherTable = memo(({ onEdit, onDelete, ...tableProps }: VoucherTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<VoucherResponse>[]>(
        () => [
            { header: t('shopAdmin.voucher.fields.code'), accessorKey: 'code' },
            { header: t('shopAdmin.voucher.fields.name'), accessorKey: 'name' },
            {
                header: t('shopAdmin.voucher.fields.discount'),
                accessorKey: 'discountValue',
                cell: ({ row }) => formatDiscount(row.original),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.voucher.fields.maxDiscount'),
                accessorKey: 'maxDiscount',
                enableSorting: false,
                cell: ({ row }) => formatVnd(row.original.maxDiscount),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.voucher.fields.minOrderValue'),
                accessorKey: 'minOrderValue',
                enableSorting: false,
                cell: ({ row }) => formatVnd(row.original.minOrderValue),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.voucher.fields.usage'),
                accessorKey: 'usedCount',
                enableSorting: false,
                cell: ({ row }) =>
                    `${formatCount(row.original.usedCount ?? 0)} / ${
                        row.original.usageLimit != null ? formatCount(row.original.usageLimit) : '∞'
                    }`,
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.voucher.fields.startAt'),
                accessorKey: 'startAt',
                cell: ({ row }) => formatDateTime(row.original.startAt),
            },
            {
                header: t('shopAdmin.voucher.fields.endAt'),
                accessorKey: 'endAt',
                cell: ({ row }) => formatDateTime(row.original.endAt),
            },
            {
                header: t('common.status'),
                accessorKey: 'status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="active" status={row.original.status} />,
            },
        ],
        [t],
    )

    const actions = useMemo(
        () =>
            buildRowActions<VoucherResponse>(
                [
                    { id: 'edit', label: t('common.edit'), onClick: onEdit },
                    { id: 'delete', label: t('common.delete'), onClick: onDelete },
                ],
                checkPermission,
            ),
        [t, onEdit, onDelete, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} />
})

VoucherTable.displayName = 'VoucherTable'
