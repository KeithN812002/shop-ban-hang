import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageSkeleton, useMenuLocalizedTitle } from '@/hooks'
import { useExternalUserFilters, type ExternalUserFilterForm } from './useExternalUserFilters'
import { useExternalUserTableState } from './useExternalUserTableState'
import { useExternalUserMutations } from './index'

export const useExternalUserPage = () => {
    const { t } = useTranslation()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const { filters, setFilters, onSearch, onReset, methods, hasActiveFilter } = useExternalUserFilters()
    const { pageNumber, pageSize, onPageChange, onPageSizeChange, sorting, onSortChange } = useExternalUserTableState(
        filters,
        setFilters,
    )

    const {
        usersQuery,
        detailQuery,
        isAnyMutationPending,
        loadingMessage,
        handleAdd,
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
        handleResetPassword,
        handleResetPasswordBulk,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
    } = useExternalUserMutations(filters, refreshTrigger)

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
        handleAdd,
        handleResetPasswordBulk,
        handleActiveBulk,
        handleInactiveBulk,
        handleDeleteBulk,
        selectedRows,
        filterProps: useMemo(
            () => ({
                methods,
                onSearch: (data: ExternalUserFilterForm) => {
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
                onResetPassword: handleResetPassword,
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
                handleResetPassword,
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

useExternalUserPage.displayName = 'useExternalUserPage'
export default useExternalUserPage
