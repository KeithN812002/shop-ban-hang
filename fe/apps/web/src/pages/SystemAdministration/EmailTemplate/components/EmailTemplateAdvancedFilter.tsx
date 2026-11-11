import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Filter } from 'lucide-react'
import { AdvancedFilterContent, FilterSection } from '@workspace/ui/components/DataTable'
import { Separator } from '@workspace/ui/components/Separator'
import { BsSelect } from '@workspace/ui/components/Select'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { EMAIL_OUTBOX_EVENT_TYPE_OPTIONS, STATUS_OPTIONS } from '../types'

export type EventTypeOption = (typeof EMAIL_OUTBOX_EVENT_TYPE_OPTIONS)[number]

interface EmailTemplateAdvancedFilterProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
    eventTypeOptions: EventTypeOption[]
}

export const EmailTemplateAdvancedFilter = memo(
    ({ isOpen, onClose, onApply, eventTypeOptions }: EmailTemplateAdvancedFilterProps) => {
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
                        label={t('emailTemplate.fields.eventType')}
                        name="eventType"
                        options={eventTypeOptions}
                        valueKey="value"
                        labelKey="label"
                        selectionMode="multiple"
                        className="w-full"
                    />
                    <BsInput label={t('emailTemplate.fields.subjectTemplate')} name="subjectTemplate" />
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
    },
)

EmailTemplateAdvancedFilter.displayName = 'EmailTemplateAdvancedFilter'
