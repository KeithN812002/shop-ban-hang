import { memo, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import dayjs from 'dayjs'
import { RotateCw } from 'lucide-react'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { DataTable, ActionDef, DataTableSorting, mergeSelectedRows } from '@workspace/ui/components/DataTable'
import { Badge } from '@workspace/ui/components/Badge'
import type { EmailOutboxResponse } from '../types'
import { EMAIL_OUTBOX_STATUS_COLOR_MAP } from '@/constants/options'

interface EmailOutboxTableProps {
    rows: EmailOutboxResponse[]
    isLoading?: boolean
    isError?: boolean
    hasActiveFilter?: boolean
    startIndex?: number
    onView: (item: EmailOutboxResponse) => void
    onResend: (id: string) => void
    sorting?: DataTableSorting | null
    onSortChange?: (sorting: DataTableSorting | null) => void
    pageNumber: number
    pageSize: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
    selectedRows?: EmailOutboxResponse[]
    onSelectedRowsChange?: (rows: EmailOutboxResponse[]) => void
}

export const EmailOutboxTable = memo(
    ({
        rows,
        isLoading,
        isError,
        hasActiveFilter,
        startIndex = 0,
        onView,
        onResend,
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
    }: EmailOutboxTableProps) => {
        const { t } = useTranslation()
        const { checkPermission } = usePermissionAction()

        const columns = useMemo<ColumnDef<EmailOutboxResponse>[]>(
            () => [
                {
                    header: t('emailOutbox.fields.eventType'),
                    accessorKey: 'eventType',
                    enableSorting: false,
                    cell: ({ getValue }) => {
                        const val = getValue<string>()
                        return val ? t(`emailOutbox.eventType.${val}`, val) : ''
                    },
                },
                {
                    header: t('emailOutbox.fields.receiver'),
                    accessorKey: 'receiver',
                    cell: ({ getValue }) => {
                        const val = getValue<string>()
                        if (!val) return ''
                        const emails = val
                            .split(',')
                            .map(e => e.trim())
                            .filter(Boolean)
                        if (emails.length === 0) return ''
                        if (emails.length === 1) {
                            return (
                                <Badge variant="secondary" className="font-normal text-xs">
                                    {emails[0]}
                                </Badge>
                            )
                        }
                        return (
                            <div className="flex items-center gap-1 py-1" title={emails.join(', ')}>
                                <Badge variant="secondary" className="font-normal text-xs max-w-[200px] truncate">
                                    {emails[0]}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="font-normal text-xs bg-neutral-100 text-neutral-600 border-neutral-200 shrink-0"
                                >
                                    +{emails.length - 1}
                                </Badge>
                            </div>
                        )
                    },
                },
                {
                    header: t('emailOutbox.fields.subject'),
                    accessorKey: 'subject',
                },
                {
                    header: t('emailOutbox.fields.sentAt'),
                    accessorKey: 'sentAt',
                    cell: ({ getValue }) => {
                        const value = getValue<string>()
                        return value ? dayjs(value).format('HH:mm:ss DD/MM/YYYY') : ''
                    },
                },
                {
                    header: t('emailOutbox.fields.retryCount'),
                    accessorKey: 'retryCount',
                    cell: ({ getValue }) => <div className="flex justify-center">{getValue<number>()}</div>,
                },
                {
                    header: t('emailOutbox.fields.status'),
                    accessorKey: 'status',
                    enableSorting: false,
                    cell: ({ row }) => {
                        const status = row.original.status
                        const styleClass = status
                            ? EMAIL_OUTBOX_STATUS_COLOR_MAP[status] || 'border-slate-300 bg-slate-50 text-slate-500'
                            : 'border-slate-300 bg-slate-50 text-slate-500'
                        return (
                            <div className="flex justify-center">
                                <Badge variant="outline" className={styleClass}>
                                    {status ? t(`emailOutbox.status.${status.toLowerCase()}`, status) : ''}
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

        const actions = useMemo<ActionDef<EmailOutboxResponse>[]>(
            () => [
                {
                    id: 'view',
                    type: 'view',
                    label: t('common.view'),
                    onClick: row => onView(row as EmailOutboxResponse),
                },
                {
                    id: 'resend',
                    type: 'custom',
                    label: t('emailOutbox.actions.resend'),
                    icon: RotateCw,
                    color: 'text-amber-600 hover:text-amber-700',
                    onClick: row => onResend(row.id),
                    showWhen: row => row.status === 'FAIL' || row.status === 'CANCELLED',
                },
            ],
            [onView, onResend, t],
        )

        const filteredActions = useMemo<ActionDef<EmailOutboxResponse>[]>(
            () =>
                actions.filter(action => {
                    if (action.id === 'view') return true
                    if (action.id === 'resend') {
                        return checkPermission('resend')
                    }
                    return checkPermission(action.id)
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

        const enableRowSelection = useCallback((row: EmailOutboxResponse) => {
            return row.status === 'FAIL' || row.status === 'CANCELLED'
        }, [])

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
                columnPinning={{ right: ['actions'] }}
                enableSorting
                sorting={sorting}
                setSorting={onSortChange}
                enableRowSelection={onSelectedRowsChange ? enableRowSelection : undefined}
                rowSelection={onSelectedRowsChange ? rowSelection : undefined}
                setRowSelection={onSelectedRowsChange ? handleRowSelectionChange : undefined}
                scrollHeight="max(320px, calc(100dvh - 388px))"
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

EmailOutboxTable.displayName = 'EmailOutboxTable'
