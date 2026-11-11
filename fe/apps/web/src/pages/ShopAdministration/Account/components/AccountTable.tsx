import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import type { DataTableSorting } from '@workspace/ui/components/DataTable'
import { Button } from '@workspace/ui/components/Button'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable, type ShopTablePagination } from '../../components/ShopDataTable'
import { buildRowActions } from '../../components/rowActions'
import { formatCount, formatDateTime, formatVnd } from '../../utils/format'
import type { AccountRow } from '../../types'

interface AccountTableProps {
    rows: AccountRow[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pagination: ShopTablePagination
    onAction: (actionId: string, account: AccountRow) => void
    onOpenStore: (account: AccountRow) => void
    onOpenShipper: (account: AccountRow) => void
}

export const AccountTable = memo(({ onAction, onOpenStore, onOpenShipper, ...tableProps }: AccountTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<AccountRow>[]>(
        () => [
            { header: t('shopAdmin.account.fields.username'), accessorKey: 'username' },
            { header: t('shopAdmin.account.fields.fullName'), accessorKey: 'fullName' },
            {
                header: t('shopAdmin.account.fields.contact'),
                accessorKey: 'email',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="min-w-0">
                        <div className="truncate">{row.original.email}</div>
                        <div className="truncate text-xs text-muted-foreground">{row.original.phone}</div>
                    </div>
                ),
            },
            {
                header: t('shopAdmin.account.fields.roles'),
                accessorKey: 'roles',
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {(row.original.roles ?? []).map(role => (
                            <StatusBadge key={role} domain="role" status={role} />
                        ))}
                    </div>
                ),
            },
            {
                header: t('shopAdmin.account.fields.orderCount'),
                accessorKey: 'orderCount',
                cell: ({ row }) => formatCount(row.original.orderCount),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.account.fields.totalSpent'),
                accessorKey: 'totalSpent',
                cell: ({ row }) => formatVnd(row.original.totalSpent),
                meta: { className: 'text-right' },
            },
            {
                header: t('shopAdmin.account.fields.store'),
                accessorKey: 'storeName',
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.storeId ? (
                        <div className="flex flex-col items-start gap-1">
                            <Button variant="link" onPress={() => onOpenStore(row.original)}>
                                {row.original.storeName || t('shopAdmin.account.viewStore')}
                            </Button>
                            <StatusBadge domain="entity" status={row.original.storeStatus} />
                        </div>
                    ) : null,
            },
            {
                header: t('shopAdmin.account.fields.shipper'),
                accessorKey: 'shipperStatus',
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.shipperId ? (
                        <div className="flex flex-col items-start gap-1">
                            <Button variant="link" onPress={() => onOpenShipper(row.original)}>
                                {t('shopAdmin.account.viewShipper')}
                            </Button>
                            <StatusBadge domain="entity" status={row.original.shipperStatus} />
                        </div>
                    ) : null,
            },
            {
                header: t('common.status'),
                accessorKey: 'status',
                enableSorting: false,
                cell: ({ row }) => <StatusBadge domain="active" status={row.original.status} />,
            },
            {
                header: t('common.audit.createdDate'),
                accessorKey: 'createdDate',
                cell: ({ row }) => formatDateTime(row.original.createdDate),
            },
        ],
        [t, onOpenStore, onOpenShipper],
    )

    const actions = useMemo(
        () =>
            buildRowActions<AccountRow>(
                [
                    {
                        id: 'lock',
                        label: t('shopAdmin.actions.lock'),
                        onClick: row => onAction('lock', row),
                        showWhen: row => row.status === 'ACTIVE',
                    },
                    {
                        id: 'unlock',
                        label: t('shopAdmin.actions.unlock'),
                        onClick: row => onAction('unlock', row),
                        showWhen: row => row.status === 'INACTIVE',
                    },
                ],
                checkPermission,
            ),
        [t, onAction, checkPermission],
    )

    return <ShopDataTable {...tableProps} columns={columns} actions={actions} />
})

AccountTable.displayName = 'AccountTable'
