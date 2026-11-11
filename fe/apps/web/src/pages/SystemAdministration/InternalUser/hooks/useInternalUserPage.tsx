import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageSkeleton, useMenuLocalizedTitle } from '@/hooks'
import { useInternalUserFilters, type InternalUserFilterForm } from './useInternalUserFilters'
import { useInternalUserTableState } from './useInternalUserTableState'
import { useInternalUserMutations } from './index'

export const useInternalUserPage = () => {
    const { t } = useTranslation()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const { filters, setFilters, onSearch, onReset, methods, hasActiveFilter } = useInternalUserFilters()
    const { pageNumber, pageSize, onPageChange, onPageSizeChange, sorting, onSortChange } = useInternalUserTableState(
        filters,
        setFilters,
    )

    const {
        usersQuery,
        detailQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleEdit,
        handleDelete,
        handleActive,
        handleInactive,
        handleFormSubmit,
        handleClose,
        isFormOpen,
        selectedUserId,
        isReadOnly,
        selectedRows,
        setSelectedRows,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
    } = useInternalUserMutations(filters, refreshTrigger)

    const { data: userData, isLoading: isUsersLoading, isFetching: isUsersFetching } = usersQuery

    const { showFullSkeleton } = usePageSkeleton(isUsersLoading, !!userData)
    const title = useMenuLocalizedTitle()
    const finalLoading = isUsersFetching || isAnyMutationPending
    const isTableLoading = isUsersLoading || isUsersFetching

    const totalItems = userData?.total || 0
    const activePage = userData?.page || pageNumber
    const activePageSize = userData?.pageSize || pageSize

    return {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        filterProps: useMemo(
            () => ({
                methods,
                onSearch: (data: InternalUserFilterForm) => {
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
                rows: userData?.items || [],
                isLoading: isTableLoading,
                isError: usersQuery.isError,
                hasActiveFilter,
                startIndex: (activePage - 1) * activePageSize,
                onView: handleView,
                onEdit: handleEdit,
                onDelete: handleDelete,
                onActive: handleActive,
                onInactive: handleInactive,
                sorting,
                onSortChange,
                pageNumber: activePage,
                pageSize: activePageSize,
                totalPages: userData?.totalPages || 0,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows,
                onSelectedRowsChange: setSelectedRows,
            }),
            [
                userData?.items,
                isTableLoading,
                usersQuery.isError,
                hasActiveFilter,
                activePage,
                activePageSize,
                handleView,
                handleEdit,
                handleDelete,
                handleActive,
                handleInactive,
                sorting,
                onSortChange,
                userData?.totalPages,
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
                selectedUserId,
                user: detailQuery.data,
                isReadOnly,
            }),
            [isFormOpen, handleFormSubmit, selectedUserId, detailQuery.data, isReadOnly],
        ),
    }
}

useInternalUserPage.displayName = 'useInternalUserPage'
export default useInternalUserPage
