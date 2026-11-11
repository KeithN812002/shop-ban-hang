import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Clock } from 'lucide-react'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { STATUS_OPTIONS } from '@/constants/options'
import { AdvancedFilterContent, FilterSection } from '@workspace/ui/components/DataTable'
import { Separator } from '@workspace/ui/components/Separator'

interface RoleAdvancedFilterProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
}

export const RoleAdvancedFilter = memo(({ isOpen, onClose, onApply }: RoleAdvancedFilterProps) => {
    const { t } = useTranslation()

    return (
        <AdvancedFilterContent
            isOpen={isOpen}
            onClose={onClose}
            onApply={onApply}
            title={t('common.advancedFilter')}
            t={t}
        >
            <FilterSection title={t('common.filterSections.basic')} icon={Filter}>
                <BsInput label={t('role.fields.code')} name="code" />
                <BsInput label={t('role.fields.name')} name="name" />
                <BsSelect
                    label={t('common.status')}
                    name="status"
                    options={STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    selectionMode="multiple"
                    className="w-full"
                />
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

RoleAdvancedFilter.displayName = 'RoleAdvancedFilter'
