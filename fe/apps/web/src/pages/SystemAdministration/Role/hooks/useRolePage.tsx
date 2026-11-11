import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageSkeleton, useMenuLocalizedTitle } from '@/hooks'
import type { MenuItem } from '@/types/menu.types'
import type { RoleFilterRequest } from '../types'
import { useRoleFilters } from './useRoleFilters'
import { useRoleTableState } from './useRoleTableState'
import { useRoleMutations } from './useRoleMutations'

export const useRolePage = (menuItem?: MenuItem) => {
    const { t } = useTranslation()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const { filters, setFilters, onSearch, onReset, methods, hasActiveFilter } = useRoleFilters()
    const { pageNumber, pageSize, onPageChange, onPageSizeChange, sorting, onSortChange } = useRoleTableState(
        filters,
        setFilters,
    )

    const {
        rolesQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleEdit,
        handleDelete,
        handleActive,
        handleInactive,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        setSelectedRows,
        handleFormSubmit,
        handleClose,
        isFormOpen,
        setIsFormOpen,
        selectedRoleId,
        isReadOnly,
        handleAdd,
    } = useRoleMutations(filters, refreshTrigger)

    const { data: roleData, isLoading: isRolesLoading, isFetching: isRolesFetching } = rolesQuery

    const { showFullSkeleton } = usePageSkeleton(isRolesLoading, !!roleData)
    const title = useMenuLocalizedTitle(menuItem)
    const finalLoading = showFullSkeleton || isRolesFetching || isAnyMutationPending
    const isTableLoading = isRolesLoading || isRolesFetching

    const totalItems = roleData?.total || 0

    return {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        handleAdd,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        isAnyMutationPending,
        roleData,
        pageNumber,
        pageSize,
        totalPages: roleData?.totalPages || 0,
        handlePageChange: onPageChange,
        handlePageSizeChange: onPageSizeChange,
        filterProps: useMemo(
            () => ({
                methods,
                onSearch: (data: RoleFilterRequest) => {
                    onSearch(data)
                    setSelectedRows([])
                    setRefreshTrigger(prev => prev + 1)
                },
                onReset: () => {
                    onReset()
                    setSelectedRows([])
                },
            }),
            [methods, onSearch, onReset, setSelectedRows],
        ),
        tableProps: useMemo(
            () => ({
                rows: roleData?.items || [],
                isLoading: isTableLoading,
                isError: rolesQuery.isError,
                hasActiveFilter,
                startIndex: (pageNumber - 1) * pageSize,
                onView: handleView,
                onEdit: handleEdit,
                onDelete: handleDelete,
                onActive: handleActive,
                onInactive: handleInactive,
                sorting,
                onSortChange,
                pageNumber,
                pageSize,
                totalPages: roleData?.totalPages || 0,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows,
                onSelectedRowsChange: setSelectedRows,
            }),
            [
                roleData?.items,
                isTableLoading,
                rolesQuery.isError,
                hasActiveFilter,
                isAnyMutationPending,
                pageNumber,
                pageSize,
                handleView,
                handleEdit,
                handleDelete,
                handleActive,
                handleInactive,
                sorting,
                onSortChange,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows,
                setSelectedRows,
            ],
        ),
        dialogProps: useMemo(
            () => ({
                isOpen: isFormOpen,
                onClose: handleClose,
                onSubmit: handleFormSubmit,
                selectedRoleId,
                isPending: rolesQuery.isFetching || isAnyMutationPending,
                isReadOnly,
            }),
            [
                isFormOpen,
                setIsFormOpen,
                handleFormSubmit,
                selectedRoleId,
                rolesQuery.isFetching,
                isAnyMutationPending,
                isReadOnly,
            ],
        ),
    }
}
