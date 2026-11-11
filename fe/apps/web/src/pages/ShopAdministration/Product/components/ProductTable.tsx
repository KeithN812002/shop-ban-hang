import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { MediaName } from '../../components/MediaName'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildRowActions } from '../../components/rowActions'
import { formatCount, formatDateTime, formatVnd } from '../../utils/format'
import type { ProductResponse } from '../../types'

interface ProductTableProps {
    rows: ProductResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onView: (product: ProductResponse) => void
    onAction: (actionId: string, product: ProductResponse) => void
}

export const ProductTable = memo(({ onView, onAction, ...tableProps }: ProductTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<ProductResponse>[]>(
        () => [
            {
                header: t('shopAdmin.product.fields.name'),
                accessorKey: 'name',
                cell: ({ row }) => <MediaName name={row.original.name} imageUrl={row.original.thumbnailUrl} />,
            },
            { header: t('shopAdmin.product.fields.store'), accessorKey: 'storeName', enableSorting: false },
            { header: t('shopAdmin.product.fields.category'), accessorKey: 'categoryName', enableSorting: false },
            {
                header: t('shopAdmin.product.fields.price'),
                accessorKey: 'price',
                cell: ({ row }) => formatVnd(row.original.price),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.product.fields.stock'),
                accessorKey: 'stock',
                cell: ({ row }) => formatCount(row.original.stock),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.product.fields.soldCount'),
                accessorKey: 'soldCount',
                cell: ({ row }) => formatCount(row.original.soldCount),
                meta: { className: 'text-right' },
            },
            {
                header: t('common.status'),
                accessorKey: 'status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="product" status={row.original.status} />,
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
            buildRowActions<ProductResponse>(
                [
                    { id: 'view', label: t('common.view'), onClick: onView },
                    {
                        id: 'ban',
                        label: t('shopAdmin.actions.ban'),
                        onClick: row => onAction('ban', row),
                        showWhen: row => row.status !== 'BANNED',
                    },
                    {
                        id: 'unban',
                        label: t('shopAdmin.actions.unban'),
                        onClick: row => onAction('unban', row),
                        showWhen: row => row.status === 'BANNED',
                    },
                ],
                checkPermission,
            ),
        [t, onView, onAction, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} />
})

ProductTable.displayName = 'ProductTable'
