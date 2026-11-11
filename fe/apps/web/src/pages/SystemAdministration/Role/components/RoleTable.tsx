import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import dayjs from 'dayjs'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, ActionDef, DataTableSorting, mergeSelectedRows } from '@workspace/ui/components/DataTable'
import { Badge } from '@workspace/ui/components/Badge'
import { StatusEnum } from '@/constants/options'
import type { RoleResponse } from '../types'

interface RoleTableProps {
    rows: RoleResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    onView: (role: RoleResponse) => void
    onEdit: (role: RoleResponse) => void
    onDelete: (role: RoleResponse) => void
    onActive: (role: RoleResponse) => void
    onInactive: (role: RoleResponse) => void
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pageNumber: number
    pageSize: number
    totalItems: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    selectedRows?: RoleResponse[]
    onSelectedRowsChange?: (rows: RoleResponse[]) => void
}

export const RoleTable = memo(
    ({
        rows,
        isLoading,
        isError,
        hasActiveFilter,
        startIndex = 0,
        onView,
        onEdit,
        onDelete,
        onActive,
        onInactive,
        sorting,
        onSortChange,
        pageNumber,
        pageSize,
        totalItems,
        totalPages,
        onPageChange,
        onPageSizeChange,
        selectedRows = [],
        onSelectedRowsChange,
    }: RoleTableProps) => {
        const { t } = useTranslation()

        const columns = useMemo<ColumnDef<RoleResponse>[]>(
            () => [
                {
                    header: t('role.fields.code'),
                    accessorKey: 'code',
                },
                {
                    header: t('role.fields.name'),
                    accessorKey: 'name',
                },
                {
                    header: t('common.status'),
                    accessorKey: 'status',
                    enableSorting: false,
                    cell: ({ row }) => {
                        const isActive = row.original.status === StatusEnum.ACTIVE
                        return (
                            <div className="flex justify-center">
                                <Badge
                                    variant="outline"
                                    className={
                                        isActive
                                            ? 'border-green-500/30 bg-green-50 text-green-600 dark:border-green-400/30 dark:bg-green-950/40 dark:text-green-400 font-semibold'
                                            : 'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-950/40 dark:text-slate-400 font-semibold'
                                    }
                                >
                                    {isActive ? t('common.active') : t('common.inactive')}
                                </Badge>
                            </div>
                        )
                    },
                },
                {
                    header: t('common.audit.createdDate'),
                    accessorKey: 'createdDate',
                    cell: ({ getValue }) => {
                        const value = getValue<string>()
                        return value ? dayjs(value).format('HH:mm:ss DD/MM/YYYY') : ''
                    },
                },
                {
                    header: t('common.audit.createdBy'),
                    accessorKey: 'createdBy',
                },
                {
                    header: t('common.audit.updatedDate'),
                    accessorKey: 'updatedDate',
                    cell: ({ getValue }) => {
                        const value = getValue<string>()
                        return value ? dayjs(value).format('HH:mm:ss DD/MM/YYYY') : ''
                    },
                },
                {
                    header: t('common.audit.updatedBy'),
                    accessorKey: 'updatedBy',
                },
            ],
            [t],
        )

        const actions = useMemo<ActionDef<RoleResponse>[]>(
            () => [
                { id: 'view', type: 'view', label: t('common.view'), onClick: onView },
                { id: 'edit', type: 'edit', label: t('common.edit'), onClick: onEdit },
                {
                    id: 'active',
                    type: 'unlock',
                    label: t('common.active'),
                    onClick: onActive,
                    showWhen: row => row.status === StatusEnum.INACTIVE,
                },
                {
                    id: 'inactive',
                    type: 'lock',
                    label: t('common.inactive'),
                    onClick: onInactive,
                    showWhen: row => row.status !== StatusEnum.INACTIVE,
                },
                { id: 'delete', type: 'delete', label: t('common.delete'), onClick: onDelete },
            ],
            [onActive, onDelete, onEdit, onInactive, onView, t],
        )

        const { checkPermission } = usePermissionAction()

        const filteredActions = useMemo(
            () =>
                actions.filter(action => {
                    if (action.id === 'view') return true
                    if (action.id === 'edit') return checkPermission('update')
                    if (action.id === 'active' || action.id === 'inactive') return checkPermission('update')
                    if (action.id === 'delete') return checkPermission('delete')
                    return true
                }),
            [actions, checkPermission],
        )

        const rowSelection = useMemo(() => {
            const selection: Record<string, boolean> = {}
            selectedRows.forEach(row => {
                if (row.id) selection[String(row.id)] = true
            })
            return selection
        }, [selectedRows])

        const handleRowSelectionChange = useCallback(
            (
                updaterOrValue:
                    | Record<string, boolean>
                    | ((prevState: Record<string, boolean>) => Record<string, boolean>),
            ) => {
                if (!onSelectedRowsChange) return
                const newSelection =
                    typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue
                onSelectedRowsChange(mergeSelectedRows(selectedRows, rows, newSelection))
            },
            [rowSelection, rows, selectedRows, onSelectedRowsChange],
        )

        return (
            <DataTable
                data={rows}
                columns={columns}
                actions={filteredActions}
                startIndex={startIndex}
                isLoading={isLoading}
                isError={isError}
                hasActiveFilter={hasActiveFilter}
                t={t}
                scrollHeight="max(320px, calc(100dvh - 388px))"
                columnPinning={{ right: ['actions'] }}
                enableSorting
                sorting={sorting}
                setSorting={onSortChange}
                enableRowSelection={onSelectedRowsChange ? true : undefined}
                rowSelection={onSelectedRowsChange ? rowSelection : undefined}
                setRowSelection={onSelectedRowsChange ? handleRowSelectionChange : undefined}
                pagination={{
                    pageNumber,
                    pageSize,
                    totalItems,
                    totalPages,
                    onPageChange,
                    onPageSizeChange,
                }}
            />
        )
    },
)

RoleTable.displayName = 'RoleTable'
