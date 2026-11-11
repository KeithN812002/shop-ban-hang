import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput } from '@workspace/ui/components/Textfield'
import { FilterBar } from '@workspace/ui/components/DataTable'

interface ShipperFilterProps {
    onSearch: (data: { keyword: string }) => void
    onReset: () => void
}

export const ShipperFilter = memo(({ onSearch, onReset }: ShipperFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<{ keyword: string }>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsInput label={t('shopAdmin.shipper.fields.keyword')} name="keyword" />
        </FilterBar>
    )
})

ShipperFilter.displayName = 'ShipperFilter'
