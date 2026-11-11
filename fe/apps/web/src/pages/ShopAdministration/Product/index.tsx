import { memo } from 'react'
import { FormProvider } from 'react-hook-form'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { ReasonDialog } from '../components/ReasonDialog'
import { ProductDetailDialog } from './components/ProductDetailDialog'
import { ProductFilter } from './components/ProductFilter'
import { ProductTable } from './components/ProductTable'
import { useProductPage } from './hooks'

const ProductPage = memo(() => {
    const { t, title, finalLoading, filterProps, tableProps, detailProps, reasonDialogProps } = useProductPage()

    return (
        <LoadingOverlay
            isLoading={finalLoading}
            isFullScreen={finalLoading}
            text={t('common.processing')}
            className="flex flex-col h-full"
        >
            <PageContainer title={title} className="flex-1 flex flex-col">
                <FormProvider {...filterProps.methods}>
                    <ProductFilter
                        storeOptions={filterProps.storeOptions}
                        categoryOptions={filterProps.categoryOptions}
                        onSearch={filterProps.onSearch}
                        onReset={filterProps.onReset}
                    />
                </FormProvider>
                <ProductTable {...tableProps} />
                <ProductDetailDialog {...detailProps} />
                <ReasonDialog {...reasonDialogProps} />
            </PageContainer>
        </LoadingOverlay>
    )
})

ProductPage.displayName = 'ProductPage'
export default ProductPage
