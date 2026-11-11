import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Filter, Clock, Search } from 'lucide-react'
import { AdvancedFilterContent, FilterSection } from '@workspace/ui/components/DataTable'
import { Separator } from '@workspace/ui/components/Separator'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsInput, BsNumberRange } from '@workspace/ui/components/Textfield'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { EMAIL_OUTBOX_STATUS_OPTIONS, EMAIL_OUTBOX_EVENT_TYPE_OPTIONS } from '../types'

interface EmailOutboxAdvancedFilterProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
}

export const EmailOutboxAdvancedFilter = memo(({ isOpen, onClose, onApply }: EmailOutboxAdvancedFilterProps) => {
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
                <BsSelect
                    label={t('emailOutbox.fields.eventType')}
                    name="eventType"
                    options={EMAIL_OUTBOX_EVENT_TYPE_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    selectionMode="multiple"
                    className="w-full"
                />
                <BsInput label={t('emailOutbox.fields.receiver')} name="receiver" />
                <BsSelect
                    label={t('emailOutbox.fields.status')}
                    name="status"
                    options={EMAIL_OUTBOX_STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    selectionMode="multiple"
                    className="w-full"
                />
            </FilterSection>

            <Separator className="opacity-50" />

            <FilterSection title={t('common.filterSections.advanced')} icon={Search}>
                <BsInput label={t('emailOutbox.fields.subject')} name="subject" />
                <BsDateRangePicker label={t('emailOutbox.fields.sentAt')} name="sentAtRange" />
                <BsNumberRange
                    label={t('emailOutbox.fields.retryCount')}
                    nameFrom="retryCountFrom"
                    nameTo="retryCountTo"
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

EmailOutboxAdvancedFilter.displayName = 'EmailOutboxAdvancedFilter'
