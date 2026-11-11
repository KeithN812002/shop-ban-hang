import { useTranslation } from 'react-i18next'
import { useMenuLocalizedTitle, usePageSkeleton } from '@/hooks'
import { useCategoryRows } from '../../hooks/useCatalogQueries'
import { useCategoryMutations } from './useCategoryMutations'

const NO_ROWS: never[] = []

export const useCategoryPage = () => {
    const { t } = useTranslation()
    const query = useCategoryRows()
    const mutations = useCategoryMutations()

    const { showFullSkeleton } = usePageSkeleton(query.isLoading, !!query.data)
    const title = useMenuLocalizedTitle()
    const rows = query.data ?? NO_ROWS

    return {
        t,
        title,
        finalLoading: query.isFetching || mutations.isAnyMutationPending,
        showFullSkeleton,
        handleAdd: mutations.handleAdd,
        tableProps: {
            rows,
            isLoading: query.isLoading,
            isError: query.isError,
            onEdit: mutations.handleEdit,
            onDelete: mutations.handleDelete,
        },
        dialogProps: {
            isOpen: !!mutations.formTarget,
            category: mutations.formTarget?.mode === 'edit' ? mutations.formTarget.category : undefined,
            allCategories: rows,
            isPending: mutations.isSaving,
            onClose: mutations.handleClose,
            onSubmit: mutations.handleSubmit,
        },
    }
}
