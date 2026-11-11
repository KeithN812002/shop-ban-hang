import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageSkeleton, useMenuLocalizedTitle } from '@/hooks'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import type { MenuItem } from '@/types/menu.types'
import { useEmailTemplateFilters, type EmailTemplateFilterForm } from './useEmailTemplateFilters'
import { useEmailTemplateTableState } from './useEmailTemplateTableState'
import { useEmailTemplateMutations } from './useEmailTemplateMutations'
import type { EmailTemplateResponse } from '../types'
import { getEventTypeOptions, resolveEmailTemplateModuleType } from '../utils/emailTemplateScope'

export const useEmailTemplatePage = (menuItem?: MenuItem) => {
    const { t } = useTranslation()
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const title = useMenuLocalizedTitle(menuItem)
    const moduleType = useMemo(() => resolveEmailTemplateModuleType(menuItem), [menuItem])
    const { checkPermission } = usePermissionAction()
    const canUpdate = checkPermission('update')
    const canActive = checkPermission('active')
    const canInactive = checkPermission('inactive')

    const { filters, setFilters, onSearch, onReset, methods, hasActiveFilter } = useEmailTemplateFilters()
    const { pageNumber, pageSize, onPageChange, onPageSizeChange, sorting, onSortChange } = useEmailTemplateTableState(
        filters,
        setFilters,
    )

    const {
        emailTemplatesQuery,
        emailTemplateQuery,
        isAnyMutationPending,
        loadingMessage,
        handleView,
        handleClose,
        handleUpdate,
        handleActive,
        handleInactive,
        handleActiveBulk,
        handleInactiveBulk,
        selectedRows,
        setSelectedRows,
        isFormOpen,
        selectedTemplateId,
        isEditMode,
        setIsEditMode,
    } = useEmailTemplateMutations(moduleType, filters, refreshTrigger)

    const { data: emailData, isLoading: isEmailsLoading, isFetching: isEmailsFetching } = emailTemplatesQuery

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
        handleActiveBulk,
        handleInactiveBulk,
        selectedRows,
        isAnyMutationPending,
        emailData,
        pageNumber,
        pageSize,
        totalPages: emailData?.totalPages || 0,
        handlePageChange: onPageChange,
        handlePageSizeChange: onPageSizeChange,
        filterProps: useMemo(
            () => ({
                methods,
                eventTypeOptions: getEventTypeOptions(moduleType),
                onSearch: (data: EmailTemplateFilterForm) => {
                    onSearch(data)
                    setSelectedRows([])
                    setRefreshTrigger(prev => prev + 1)
                },
                onReset: () => {
                    onReset()
                    setSelectedRows([])
                },
            }),
            [methods, onSearch, onReset, setSelectedRows, moduleType],
        ),
        tableProps: useMemo(
            () => ({
                rows: emailData?.items || [],
                isLoading: isTableLoading,
                isError: emailTemplatesQuery.isError,
                hasActiveFilter,
                startIndex: (activePage - 1) * activePageSize,
                onView: (row: EmailTemplateResponse) => handleView(row, false),
                onEdit: canUpdate ? (row: EmailTemplateResponse) => handleView(row, true) : undefined,
                onActive: canActive ? handleActive : undefined,
                onInactive: canInactive ? handleInactive : undefined,
                sorting,
                onSortChange,
                pageNumber: activePage,
                pageSize: activePageSize,
                totalPages: emailData?.totalPages || 0,
                totalItems,
                onPageChange,
                onPageSizeChange,
                selectedRows,
                onSelectedRowsChange: setSelectedRows,
            }),
            [
                emailData?.items,
                isTableLoading,
                emailTemplatesQuery.isError,
                hasActiveFilter,
                activePage,
                activePageSize,
                handleView,
                canUpdate,
                canActive,
                canInactive,
                handleActive,
                handleInactive,
                sorting,
                onSortChange,
                emailData?.totalPages,
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
                selectedTemplateId,
                isFetching: emailTemplateQuery.isLoading,
                emailTemplate: emailTemplateQuery.data,
                onSave: handleUpdate,
                isEditMode,
                setIsEditMode: canUpdate ? setIsEditMode : () => {},
            }),
            [
                isFormOpen,
                handleClose,
                selectedTemplateId,
                emailTemplateQuery.isLoading,
                emailTemplateQuery.data,
                handleUpdate,
                isEditMode,
                canUpdate,
                setIsEditMode,
            ],
        ),
    }
}
