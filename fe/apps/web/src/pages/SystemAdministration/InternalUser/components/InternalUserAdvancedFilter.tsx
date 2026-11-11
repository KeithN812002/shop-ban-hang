import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Clock, Search } from 'lucide-react'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { STATUS_OPTIONS, AUTHORIZATION_STATUS_OPTIONS } from '@/constants/options'
import { AdvancedFilterContent, FilterSection } from '@workspace/ui/components/DataTable'
import { Separator } from '@workspace/ui/components/Separator'

interface InternalUserAdvancedFilterProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
}

export const InternalUserAdvancedFilter = memo(({ isOpen, onClose, onApply }: InternalUserAdvancedFilterProps) => {
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
                <BsSelect
                    label={t('user.fields.authorizationStatus')}
                    name="unassignedRole"
                    options={AUTHORIZATION_STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
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

InternalUserAdvancedFilter.displayName = 'InternalUserAdvancedFilter'
