import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Unlock } from 'lucide-react'
import { useMenuLocalizedTitle } from '@/hooks'
import type { ProductStatus } from '../../constants'
import { usePagedFilters, toTableProps } from '../../hooks/usePagedFilters'
import { useCategoryOptions, useStoreOptions } from '../../hooks/useCatalogQueries'
import { useWorkflowActions, type WorkflowAction } from '../../hooks/useWorkflowActions'
import { banProduct, unbanProduct } from '../../services/shopAdminService'
import type { ProductFilterRequest, ProductResponse } from '../../types'
import { productKeys, useProductDetail, useProducts } from './useProductQueries'

export interface ProductFilterForm {
    keyword: string
    storeId: string | null
    categoryId: string | null
    status: string | null
}

const DEFAULT_FILTERS: ProductFilterRequest = {
    pageNumber: 1,
    pageSize: 20,
    keyword: '',
    storeId: undefined,
    categoryId: undefined,
    status: undefined,
}
const DEFAULT_FORM: ProductFilterForm = { keyword: '', storeId: null, categoryId: null, status: null }
const toFilters = (form: ProductFilterForm): Partial<ProductFilterRequest> => ({
    keyword: form.keyword.trim(),
    storeId: form.storeId ?? undefined,
    categoryId: form.categoryId ?? undefined,
    status: (form.status as ProductStatus | null) ?? undefined,
})

const PRODUCT_ACTIONS: WorkflowAction[] = [
    {
        id: 'ban',
        icon: Ban,
        variant: 'destructive',
        withReason: true,
        execute: banProduct,
        confirmTitle: 'shopAdmin.product.confirm.banTitle',
        confirmDescription: 'shopAdmin.product.confirm.ban',
        confirmLabel: 'shopAdmin.actions.ban',
        successMessage: 'shopAdmin.product.messages.banSuccess',
    },
    {
        id: 'unban',
        icon: Unlock,
        execute: unbanProduct,
        confirmTitle: 'shopAdmin.product.confirm.unbanTitle',
        confirmDescription: 'shopAdmin.product.confirm.unban',
        confirmLabel: 'shopAdmin.actions.unban',
        successMessage: 'shopAdmin.product.messages.unbanSuccess',
    },
]
const INVALIDATES = [productKeys.all]
const getProductName = (product: ProductResponse) => product.name

export const useProductPage = () => {
    const { t } = useTranslation()
    const [detailId, setDetailId] = useState<string | null>(null)

    const paged = usePagedFilters<ProductFilterForm, ProductFilterRequest>({
        defaultFilters: DEFAULT_FILTERS,
        defaultForm: DEFAULT_FORM,
        toFilters,
    })

    const productsQuery = useProducts(paged.filters)
    const detailQuery = useProductDetail(detailId)
    const { options: storeOptions } = useStoreOptions()
    const { options: categoryOptions } = useCategoryOptions()
    const workflow = useWorkflowActions<ProductResponse>({
        actions: PRODUCT_ACTIONS,
        getName: getProductName,
        invalidates: INVALIDATES,
    })

    const title = useMenuLocalizedTitle()

    const handleView = useCallback((product: ProductResponse) => setDetailId(product.id), [])
    const handleCloseDetail = useCallback(() => setDetailId(null), [])
    const handleDetailAction = useCallback(
        (actionId: string, product: ProductResponse) => {
            setDetailId(null)
            workflow.run(actionId, product)
        },
        [workflow],
    )

    return {
        t,
        title,
        finalLoading: productsQuery.isFetching || workflow.isPending,
        filterProps: useMemo(
            () => ({
                methods: paged.methods,
                onSearch: paged.onSearch,
                onReset: paged.onReset,
                storeOptions,
                categoryOptions,
            }),
            [paged.methods, paged.onSearch, paged.onReset, storeOptions, categoryOptions],
        ),
        tableProps: {
            ...toTableProps(productsQuery, paged),
            onView: handleView,
            onAction: workflow.run,
        },
        detailProps: {
            isOpen: !!detailId,
            isLoading: detailQuery.isLoading,
            product: detailQuery.data,
            onClose: handleCloseDetail,
            onAction: handleDetailAction,
        },
        reasonDialogProps: workflow.reasonDialogProps,
    }
}
