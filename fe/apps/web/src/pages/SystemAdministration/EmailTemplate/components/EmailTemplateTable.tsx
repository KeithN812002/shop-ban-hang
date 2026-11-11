import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit } from 'lucide-react'
import dayjs from 'dayjs'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, ActionDef, DataTableSorting, mergeSelectedRows } from '@workspace/ui/components/DataTable'
import { Badge } from '@workspace/ui/components/Badge'
import { StatusEnum } from '@/constants/options'
import type { EmailTemplateResponse } from '../types'

interface EmailTemplateTableProps {
    rows: EmailTemplateResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    onView: (item: EmailTemplateResponse) => void
    onEdit?: (item: EmailTemplateResponse) => void
    onActive?: (item: EmailTemplateResponse) => void
    onInactive?: (item: EmailTemplateResponse) => void
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pageNumber: number
    pageSize: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    selectedRows?: EmailTemplateResponse[]
    onSelectedRowsChange?: (rows: EmailTemplateResponse[]) => void
}

export const EmailTemplateTable = memo(
    ({
        rows,
        isLoading,
        isError,
        hasActiveFilter,
        startIndex = 0,
        onView,
        onEdit,
        onActive,
        onInactive,
        sorting,
        onSortChange,
        pageNumber,
        pageSize,
        totalPages,
        totalItems,
        onPageChange,
        onPageSizeChange,
        selectedRows = [],
        onSelectedRowsChange,
    }: EmailTemplateTableProps) => {
        const { t } = useTranslation()

        const columns = useMemo<ColumnDef<EmailTemplateResponse>[]>(
            () => [
                {
                    header: t('emailTemplate.fields.eventType'),
                    accessorKey: 'eventType',
                    enableSorting: false,
                    cell: ({ getValue }) => {
                        const val = getValue<string>()
                        return val ? t(`emailOutbox.eventType.${val}`, val) : ''
                    },
                },
                {
                    header: t('emailTemplate.fields.subjectTemplate'),
                    accessorKey: 'subjectTemplate',
                },
                {
                    header: t('common.status'),
                    accessorKey: 'status',
                    enableSorting: false,
                    cell: ({ row }) => {
                        const status = row.original.status
                        const isActive = status === StatusEnum.ACTIVE
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

        const actions = useMemo<ActionDef<EmailTemplateResponse>[]>(
            () => [
                {
                    id: 'view',
                    type: 'view',
                    label: t('common.view'),
                    onClick: row => onView(row as EmailTemplateResponse),
                },
                {
                    id: 'edit',
                    type: 'custom',
                    label: t('common.edit'),
                    icon: Edit,
                    color: 'text-blue-600 hover:text-blue-700',
                    onClick: row => onEdit?.(row as EmailTemplateResponse),
                    showWhen: () => !!onEdit,
                },
                {
                    id: 'active',
                    type: 'unlock',
                    label: t('common.active'),
                    onClick: row => onActive?.(row as EmailTemplateResponse),
                    showWhen: row => !!onActive && row.status !== StatusEnum.ACTIVE,
                },
                {
                    id: 'inactive',
                    type: 'lock',
                    label: t('common.inactive'),
                    onClick: row => onInactive?.(row as EmailTemplateResponse),
                    showWhen: row => !!onInactive && row.status === StatusEnum.ACTIVE,
                },
            ],
            [onView, onEdit, onActive, onInactive, t],
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
                actions={actions}
                startIndex={startIndex}
                isLoading={isLoading}
                isError={isError}
                hasActiveFilter={hasActiveFilter}
                t={t}
                columnPinning={{ right: ['actions'] }}
                enableSorting
                sorting={sorting}
                setSorting={onSortChange}
                scrollHeight="max(320px, calc(100dvh - 388px))"
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

EmailTemplateTable.displayName = 'EmailTemplateTable'
