import { memo } from 'react'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ActionButton } from '@/components/Common/ActionButton'
import { CategoryFormDialog } from './components/CategoryFormDialog'
import { CategoryTable } from './components/CategoryTable'
import { useCategoryPage } from './hooks'

const CategoryPage = memo(() => {
    const { t, title, finalLoading, showFullSkeleton, handleAdd, tableProps, dialogProps } = useCategoryPage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer
                title={title}
                isLoading={showFullSkeleton}
                className="flex-1 flex flex-col"
                loadingType="table-only"
                headerActions={<ActionButton onPress={handleAdd} actionCode="create" actionType="addNew" />}
            >
                <CategoryTable {...tableProps} />
                <CategoryFormDialog {...dialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

CategoryPage.displayName = 'CategoryPage'
export default CategoryPage
