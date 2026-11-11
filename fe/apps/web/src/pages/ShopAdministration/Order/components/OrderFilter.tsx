import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { FilterBar } from '@workspace/ui/components/DataTable'
import { ORDER_STATUS_OPTIONS } from '../../constants'
import type { OrderFilterForm } from '../hooks/useOrderPage'

interface OrderFilterProps {
    storeOptions: { id: string; name: string }[]
    onSearch: (data: OrderFilterForm) => void
    onReset: () => void
}

export const OrderFilter = memo(({ storeOptions, onSearch, onReset }: OrderFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<OrderFilterForm>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsInput label={t('shopAdmin.order.fields.code')} name="keyword" />
            <BsSelect
                label={t('common.status')}
                name="status"
                options={ORDER_STATUS_OPTIONS}
                valueKey="value"
                labelKey="label"
                isClearable
            />
            <BsSelect
                label={t('shopAdmin.order.fields.store')}
                name="storeId"
                options={storeOptions}
                valueKey="id"
                labelKey="name"
                skipTranslation
                isSearchable
                isClearable
            />
            <BsDateRangePicker label={t('shopAdmin.order.fields.createdRange')} name="dateRange" />
        </FilterBar>
    )
})

OrderFilter.displayName = 'OrderFilter'
