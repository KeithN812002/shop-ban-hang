import { memo, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { STATUS_OPTIONS } from '../types'
import type { EventTypeOption } from './EmailTemplateAdvancedFilter'
import { DEFAULT_EMAIL_TEMPLATE_FORM_VALUES, type EmailTemplateFilterForm } from '../hooks/useEmailTemplateFilters'
import { EmailTemplateAdvancedFilter } from './EmailTemplateAdvancedFilter'
import {
    useFilterTags,
    ActiveFilterTags,
    type FilterFieldConfig,
    FilterBar,
    AdvancedFilterTrigger,
} from '@workspace/ui/components/DataTable'

interface EmailTemplateFilterProps {
    onSearch: (data: EmailTemplateFilterForm) => void
    onReset: () => void
    eventTypeOptions: EventTypeOption[]
}

const ADVANCED_KEYS: readonly (keyof EmailTemplateFilterForm | readonly (keyof EmailTemplateFilterForm)[])[] = [
    'createdDateRange',
    'createdBy',
    'updatedDateRange',
    'updatedBy',
]

export const EmailTemplateFilter = memo(({ onSearch, onReset, eventTypeOptions }: EmailTemplateFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<EmailTemplateFilterForm>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [appliedValues, setAppliedValues] = useState<EmailTemplateFilterForm | null>(null)

    const handleFormSearch = (data: EmailTemplateFilterForm) => {
        onSearch(data)
        setAppliedValues(data)
    }

    const filterConfig: FilterFieldConfig<EmailTemplateFilterForm>[] = useMemo(
        () => [
            {
                key: 'eventType',
                label: t('emailTemplate.fields.eventType'),
                type: 'select',
                options: eventTypeOptions,
                isTranslation: true,
            },
            { key: 'subjectTemplate', label: t('emailTemplate.fields.subjectTemplate') },
            {
                key: 'status',
                label: t('common.status'),
                type: 'select',
                options: STATUS_OPTIONS,
                isTranslation: true,
            },
            { key: 'createdBy', label: t('common.audit.createdBy') },
            { key: 'updatedBy', label: t('common.audit.updatedBy') },
            { key: 'createdDateRange', label: t('common.audit.createdDate'), type: 'date-range' },
            { key: 'updatedDateRange', label: t('common.audit.updatedDate'), type: 'date-range' },
        ],
        [t, eventTypeOptions],
    )

    const { activeAdvancedCount, removeFilter } = useFilterTags({
        advancedKeys: ADVANCED_KEYS,
        appliedValues,
        defaultValues: DEFAULT_EMAIL_TEMPLATE_FORM_VALUES,
        onSearch: handleFormSearch,
    })

    const handleReset = () => {
        onReset()
        setAppliedValues(null)
    }

    return (
        <FilterBar
            onSubmit={handleSubmit(handleFormSearch)}
            onReset={handleReset}
            t={t}
            advancedFilter={
                <>
                    <EmailTemplateAdvancedFilter
                        isOpen={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        onApply={handleSubmit(handleFormSearch)}
                        eventTypeOptions={eventTypeOptions}
                    />
                    <AdvancedFilterTrigger
                        onPress={() => setIsDialogOpen(true)}
                        count={activeAdvancedCount}
                        ariaLabel={t('common.filter')}
                    />
                </>
            }
            activeFilters={
                <ActiveFilterTags
                    appliedValues={appliedValues}
                    config={filterConfig}
                    onRemove={removeFilter}
                    onClear={handleReset}
                    dateFormatter={date => dayjs(date).format('DD/MM/YYYY')}
                />
            }
        >
            <BsSelect
                label={t('emailTemplate.fields.eventType')}
                name="eventType"
                options={eventTypeOptions}
                valueKey="value"
                labelKey="label"
                selectionMode="multiple"
            />
            <BsInput label={t('emailTemplate.fields.subjectTemplate')} name="subjectTemplate" />
            <BsSelect
                label={t('common.status')}
                name="status"
                options={STATUS_OPTIONS}
                valueKey="value"
                labelKey="label"
                selectionMode="multiple"
            />
        </FilterBar>
    )
})

EmailTemplateFilter.displayName = 'EmailTemplateFilter'
