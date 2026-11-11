import { memo, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { EMAIL_OUTBOX_STATUS_OPTIONS, EMAIL_OUTBOX_EVENT_TYPE_OPTIONS } from '../types'
import { DEFAULT_EMAIL_OUTBOX_FORM_VALUES, type EmailOutboxFilterForm } from '../hooks'
import { EmailOutboxAdvancedFilter } from './EmailOutboxAdvancedFilter'
import {
    useFilterTags,
    ActiveFilterTags,
    type FilterFieldConfig,
    FilterBar,
    AdvancedFilterTrigger,
} from '@workspace/ui/components/DataTable'

interface EmailOutboxFilterProps {
    onSearch: (data: EmailOutboxFilterForm) => void
    onReset: () => void
}

const LINKED_KEYS: Partial<Record<keyof EmailOutboxFilterForm, readonly (keyof EmailOutboxFilterForm)[]>> = {
    retryCountFrom: ['retryCountTo'],
}

const ADVANCED_KEYS: readonly (keyof EmailOutboxFilterForm | readonly (keyof EmailOutboxFilterForm)[])[] = [
    'createdDateRange',
    'createdBy',
    'updatedDateRange',
    'updatedBy',
    'sentAtRange',
    'subject',
    ['retryCountFrom', 'retryCountTo'],
]

export const EmailOutboxFilter = memo(({ onSearch, onReset }: EmailOutboxFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<EmailOutboxFilterForm>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [appliedValues, setAppliedValues] = useState<EmailOutboxFilterForm | null>(null)

    const handleFormSearch = (data: EmailOutboxFilterForm) => {
        onSearch(data)
        setAppliedValues(data)
    }

    const filterConfig: FilterFieldConfig<EmailOutboxFilterForm>[] = useMemo(
        () => [
            {
                key: 'eventType',
                label: t('emailOutbox.fields.eventType'),
                type: 'select',
                options: EMAIL_OUTBOX_EVENT_TYPE_OPTIONS,
                isTranslation: true,
            },
            {
                key: 'status',
                label: t('emailOutbox.fields.status'),
                type: 'select',
                options: EMAIL_OUTBOX_STATUS_OPTIONS,
                isTranslation: true,
            },
            { key: 'subject', label: t('emailOutbox.fields.subject') },
            { key: 'receiver', label: t('emailOutbox.fields.receiver') },
            { key: 'sentAtRange', label: t('emailOutbox.fields.sentAt'), type: 'date-range' },
            { key: 'retryCountFrom', partnerKey: 'retryCountTo', label: t('emailOutbox.fields.retryCount') },
            { key: 'createdBy', label: t('common.audit.createdBy') },
            { key: 'updatedBy', label: t('common.audit.updatedBy') },
            { key: 'createdDateRange', label: t('common.audit.createdDate'), type: 'date-range' },
            { key: 'updatedDateRange', label: t('common.audit.updatedDate'), type: 'date-range' },
        ],
        [t],
    )

    const { activeAdvancedCount, removeFilter } = useFilterTags({
        advancedKeys: ADVANCED_KEYS,
        appliedValues,
        defaultValues: DEFAULT_EMAIL_OUTBOX_FORM_VALUES,
        onSearch: handleFormSearch,
        linkedKeys: LINKED_KEYS,
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
                    <EmailOutboxAdvancedFilter
                        isOpen={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        onApply={handleSubmit(handleFormSearch)}
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
                label={t('emailOutbox.fields.eventType')}
                name="eventType"
                options={EMAIL_OUTBOX_EVENT_TYPE_OPTIONS}
                valueKey="value"
                labelKey="label"
                selectionMode="multiple"
            />
            <BsInput label={t('emailOutbox.fields.receiver')} name="receiver" />
            <BsSelect
                label={t('emailOutbox.fields.status')}
                name="status"
                options={EMAIL_OUTBOX_STATUS_OPTIONS}
                valueKey="value"
                labelKey="label"
                selectionMode="multiple"
            />
        </FilterBar>
    )
})

EmailOutboxFilter.displayName = 'EmailOutboxFilter'
