import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { FilterBar } from '@workspace/ui/components/DataTable'
import { PRODUCT_STATUS_OPTIONS } from '../../constants'
import type { ProductFilterForm } from '../hooks/useProductPage'

interface IdNameOption {
    id: string
    name: string
}

interface ProductFilterProps {
    storeOptions: IdNameOption[]
    categoryOptions: IdNameOption[]
    onSearch: (data: ProductFilterForm) => void
    onReset: () => void
}

export const ProductFilter = memo(({ storeOptions, categoryOptions, onSearch, onReset }: ProductFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<ProductFilterForm>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsInput label={t('shopAdmin.product.fields.keyword')} name="keyword" />
            <BsSelect
                label={t('shopAdmin.product.fields.store')}
                name="storeId"
                options={storeOptions}
                valueKey="id"
                labelKey="name"
                skipTranslation
                isSearchable
                isClearable
            />
            <BsSelect
                label={t('shopAdmin.product.fields.category')}
                name="categoryId"
                options={categoryOptions}
                valueKey="id"
                labelKey="name"
                skipTranslation
                isSearchable
                isClearable
            />
            <BsSelect
                label={t('common.status')}
                name="status"
                options={PRODUCT_STATUS_OPTIONS}
                valueKey="value"
                labelKey="label"
                isClearable
            />
        </FilterBar>
    )
})

ProductFilter.displayName = 'ProductFilter'
