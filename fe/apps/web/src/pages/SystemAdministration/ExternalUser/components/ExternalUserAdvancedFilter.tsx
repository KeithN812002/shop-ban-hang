import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Clock, Search } from 'lucide-react'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { STATUS_OPTIONS } from '@/constants/options'
import { AdvancedFilterContent, FilterSection } from '@workspace/ui/components/DataTable'
import { Separator } from '@workspace/ui/components/Separator'

interface ExternalUserAdvancedFilterProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
}

export const ExternalUserAdvancedFilter = memo(({ isOpen, onClose, onApply }: ExternalUserAdvancedFilterProps) => {
    const { t } = useTranslation()

    return (
        <AdvancedFilterContent
            isOpen={isOpen}
            onClose={onClose}
            onApply={onApply}
            t={t}
            title={t('common.advancedFilter')}
            className="max-w-6xl"
        >
            <FilterSection title={t('common.filterSections.basic')} icon={Filter}>
                <BsInput label={t('common.fields.userName')} name="userName" />
                <BsInput label={t('common.fields.personalName')} name="personalName" />
                <BsSelect
                    label={t('common.status')}
                    name="status"
                    options={STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    selectionMode="multiple"
                />
            </FilterSection>

            <Separator className="opacity-50" />

            <FilterSection title={t('common.filterSections.advanced')} icon={Search}>
                <BsInput label={t('common.fields.email')} name="email" />
                <BsInput label={t('user.fields.externalUnitCode')} name="externalUnitCode" />
            </FilterSection>

            <Separator className="opacity-50" />

            <FilterSection title={t('common.filterSections.audit')} icon={Clock}>
                <BsDateRangePicker label={t('common.audit.createdDate')} name="createdDateRange" />
                <BsInput label={t('common.audit.createdBy')} name="createdBy" />
                <BsDateRangePicker label={t('common.audit.updatedDate')} name="updatedDateRange" />
                <BsInput label={t('common.audit.updatedBy')} name="updatedBy" />
            </FilterSection>
        </AdvancedFilterContent>
    )
})

ExternalUserAdvancedFilter.displayName = 'ExternalUserAdvancedFilter'
