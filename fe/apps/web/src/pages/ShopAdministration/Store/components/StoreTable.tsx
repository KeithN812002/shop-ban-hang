import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { Store as StoreIcon } from 'lucide-react'
import { MediaName } from '../../components/MediaName'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, TABS_TABLE_HEIGHT, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildModerationRowDefs, buildRowActions } from '../../components/rowActions'
import { formatCount, formatDateTime } from '../../utils/format'
import type { StoreResponse } from '../../types'

interface StoreTableProps {
    rows: StoreResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onView: (store: StoreResponse) => void
    onAction: (actionId: string, store: StoreResponse) => void
}

export const StoreTable = memo(({ onView, onAction, ...tableProps }: StoreTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<StoreResponse>[]>(
        () => [
            {
                header: t('shopAdmin.store.fields.name'),
                accessorKey: 'name',
                cell: ({ row }) => (
                    <MediaName name={row.original.name} imageUrl={row.original.logoUrl} icon={StoreIcon} />
                ),
            },
            { header: t('shopAdmin.store.fields.owner'), accessorKey: 'ownerUsername' },
            { header: t('shopAdmin.store.fields.province'), accessorKey: 'province' },
            { header: t('shopAdmin.store.fields.phone'), accessorKey: 'phone', enableSorting: false },
            {
                header: t('shopAdmin.store.fields.productCount'),
                accessorKey: 'productCount',
                cell: ({ row }) => formatCount(row.original.productCount),
            },
            {
                header: t('shopAdmin.store.fields.rating'),
                accessorKey: 'ratingAvg',
                cell: ({ row }) =>
                    row.original.ratingAvg != null
                        ? `${row.original.ratingAvg.toFixed(1)} (${formatCount(row.original.ratingCount ?? 0)})`
                        : '',
            },
            {
                header: t('common.status'),
                accessorKey: 'status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="entity" status={row.original.status} />,
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
            buildRowActions<StoreResponse>(
                [{ id: 'view', label: t('common.view'), onClick: onView }, ...buildModerationRowDefs(t, onAction)],
                checkPermission,
            ),
        [t, onView, onAction, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} scrollHeight={TABS_TABLE_HEIGHT} />
})

StoreTable.displayName = 'StoreTable'
