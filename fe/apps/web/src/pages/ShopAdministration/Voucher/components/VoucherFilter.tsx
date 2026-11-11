import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { FilterBar } from '@workspace/ui/components/DataTable'
import { ACTIVE_STATUS_OPTIONS } from '../../constants'
import type { VoucherFilterForm } from '../hooks/useVoucherPage'

interface VoucherFilterProps {
    onSearch: (data: VoucherFilterForm) => void
    onReset: () => void
}

export const VoucherFilter = memo(({ onSearch, onReset }: VoucherFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<VoucherFilterForm>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsInput label={t('shopAdmin.voucher.fields.keyword')} name="keyword" />
            <BsSelect
                label={t('common.status')}
                name="status"
                options={ACTIVE_STATUS_OPTIONS}
                valueKey="value"
                labelKey="label"
                isClearable
            />
        </FilterBar>
    )
})

VoucherFilter.displayName = 'VoucherFilter'
