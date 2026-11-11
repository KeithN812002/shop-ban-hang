import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageSkeleton, useMenuLocalizedTitle } from '@/hooks'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import type { MenuItem } from '@/types/menu.types'
import type { EmailOutboxResponse } from '../types'
import { useEmailOutboxFilters, type EmailOutboxFilterForm } from './useEmailOutboxFilters'
import { useEmailOutboxTableState } from './useEmailOutboxTableState'
import { useEmailOutboxMutations } from './useEmailOutboxMutations'

export const useEmailOutboxPage = (menuItem?: MenuItem) => {
    const { t } = useTranslation()
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const title = useMenuLocalizedTitle(menuItem)
    const { checkPermission } = usePermissionAction()
    const canResend = checkPermission('resend')

    const [selectedRows, setSelectedRows] = useState<EmailOutboxResponse[]>([])

    const { filters, setFilters, onSearch, onReset, methods, hasActiveFilter } = useEmailOutboxFilters()
    const { pageNumber, pageSize, onPageChange, onPageSizeChange, sorting, onSortChange } = useEmailOutboxTableState(
        filters,
        setFilters,
    )

    const {
        emailOutboxesQuery,
        emailOutboxQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleClose,
        handleResend,
        isFormOpen,
        selectedEmailId,
    } = useEmailOutboxMutations(filters, refreshTrigger, () => setSelectedRows([]))

    const { data: emailData, isLoading: isEmailsLoading, isFetching: isEmailsFetching } = emailOutboxesQuery

    const { showFullSkeleton } = usePageSkeleton(isEmailsLoading, !!emailData)

    const isTableLoading = isEmailsLoading || isEmailsFetching
    const finalLoading = isEmailsFetching || isAnyMutationPending

    const totalItems = emailData?.total || 0
    const activePage = emailData?.page || pageNumber
    const activePageSize = emailData?.pageSize || pageSize

    return {
        t,
        title,
        finalLoading,
        loadingMessage,
        showFullSkeleton,
        isAnyMutationPending,
        emailData,
        pageNumber,
        pageSize,
        totalPages: emailData?.totalPages || 0,
        handlePageChange: onPageChange,
        handlePageSizeChange: onPageSizeChange,
        selectedRows,
        handleResend,
        canResend,
        filterProps: useMemo(
            () => ({
                methods,
                onSearch: (data: EmailOutboxFilterForm) => {
                    onSearch(data)
                    setSelectedRows([])
                    setRefreshTrigger(prev => prev + 1)
                },
                onReset: () => {
                    onReset()
                    setSelectedRows([])
                },
            }),
            [methods, onSearch, onReset],
        ),
        tableProps: useMemo(
            () => ({
                rows: emailData?.items || [],
                isLoading: isTableLoading,
                isError: emailOutboxesQuery.isError,
                hasActiveFilter,
                startIndex: (activePage - 1) * activePageSize,
                onView: handleView,
                onResend: handleResend,
                sorting,
                onSortChange,
                pageNumber: activePage,
                pageSize: activePageSize,
                totalPages: emailData?.totalPages || 0,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows: canResend ? selectedRows : undefined,
                onSelectedRowsChange: canResend ? setSelectedRows : undefined,
            }),
            [
                emailData?.items,
                isTableLoading,
                emailOutboxesQuery.isError,
                hasActiveFilter,
                activePage,
                activePageSize,
                handleView,
                handleResend,
                sorting,
                onSortChange,
                emailData?.totalPages,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows,
                canResend,
            ],
        ),
        dialogProps: useMemo(
            () => ({
                isOpen: isFormOpen,
                onClose: handleClose,
                selectedEmailId,
                isFetching: emailOutboxQuery.isLoading,
                email: emailOutboxQuery.data,
                onResend: handleResend,
            }),
            [isFormOpen, handleClose, selectedEmailId, emailOutboxQuery.isLoading, emailOutboxQuery.data, handleResend],
        ),
    }
}

useEmailOutboxPage.displayName = 'useEmailOutboxPage'
