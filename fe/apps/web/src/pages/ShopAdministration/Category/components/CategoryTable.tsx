import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@tanstack/react-table'
import { FolderTree } from 'lucide-react'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { MediaName } from '../../components/MediaName'
import { StatusBadge } from '../../components/StatusBadge'
import { ShopDataTable } from '../../components/ShopDataTable'
import { buildRowActions } from '../../components/rowActions'
import type { CategoryRow } from '../../types'

interface CategoryTableProps {
    rows: CategoryRow[]
    isLoading?: boolean
    isError?: boolean
    onEdit: (category: CategoryRow) => void
    onDelete: (category: CategoryRow) => void
}

const INDENT_REM_PER_LEVEL = 1.5

export const CategoryTable = memo(({ onEdit, onDelete, ...tableProps }: CategoryTableProps) => {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction()

    const columns = useMemo<ColumnDef<CategoryRow>[]>(
        () => [
            {
                header: t('shopAdmin.category.fields.name'),
                accessorKey: 'name',
                enableSorting: false,
                cell: ({ row }) => (
                    <div style={{ paddingLeft: `${row.original.depth * INDENT_REM_PER_LEVEL}rem` }}>
                        <MediaName name={row.original.name} imageUrl={row.original.imageUrl} icon={FolderTree} />
                    </div>
                ),
            },
            { header: t('shopAdmin.category.fields.slug'), accessorKey: 'slug', enableSorting: false },
            { header: t('shopAdmin.category.fields.icon'), accessorKey: 'icon', enableSorting: false },
            {
                header: t('shopAdmin.category.fields.sortOrder'),
                accessorKey: 'sortOrder',
                enableSorting: false,
                meta: { className: 'text-right' },
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
            buildRowActions<CategoryRow>(
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

CategoryTable.displayName = 'CategoryTable'
