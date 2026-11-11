import { memo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { FilterBar } from '@workspace/ui/components/DataTable'
import { ACTIVE_STATUS_OPTIONS, ROLE_OPTIONS } from '../../constants'
import type { AccountFilterForm } from '../hooks/useAccountPage'

interface AccountFilterProps {
    onSearch: (data: AccountFilterForm) => void
    onReset: () => void
}

export const AccountFilter = memo(({ onSearch, onReset }: AccountFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<AccountFilterForm>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsInput label={t('shopAdmin.account.fields.keyword')} name="keyword" />
            <BsSelect
                label={t('shopAdmin.account.fields.role')}
                name="role"
                options={ROLE_OPTIONS}
                valueKey="value"
                labelKey="label"
                isClearable
            />
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

AccountFilter.displayName = 'AccountFilter'
