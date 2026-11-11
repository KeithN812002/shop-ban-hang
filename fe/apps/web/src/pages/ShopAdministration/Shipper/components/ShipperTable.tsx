import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, TABS_TABLE_HEIGHT, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildModerationRowDefs, buildRowActions } from '../../components/rowActions'
import { formatDateTime } from '../../utils/format'
import type { ShipperResponse } from '../../types'

interface ShipperTableProps {
    rows: ShipperResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onView: (shipper: ShipperResponse) => void
    onAction: (actionId: string, shipper: ShipperResponse) => void
}

export const ShipperTable = memo(({ onView, onAction, ...tableProps }: ShipperTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<ShipperResponse>[]>(
        () => [
            { header: t('shopAdmin.shipper.fields.fullName'), accessorKey: 'fullName' },
            { header: t('shopAdmin.shipper.fields.username'), accessorKey: 'username' },
            { header: t('shopAdmin.shipper.fields.phone'), accessorKey: 'phone', enableSorting: false },
            {
                header: t('shopAdmin.shipper.fields.vehicle'),
                accessorKey: 'vehiclePlate',
                enableSorting: false,
                cell: ({ row }) => [row.original.vehicleType, row.original.vehiclePlate].filter(Boolean).join(' - '),
            },
            { header: t('shopAdmin.shipper.fields.areaProvince'), accessorKey: 'areaProvince' },
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
            buildRowActions<ShipperResponse>(
                [{ id: 'view', label: t('common.view'), onClick: onView }, ...buildModerationRowDefs(t, onAction)],
                checkPermission,
            ),
        [t, onView, onAction, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} scrollHeight={TABS_TABLE_HEIGHT} />
})

ShipperTable.displayName = 'ShipperTable'
