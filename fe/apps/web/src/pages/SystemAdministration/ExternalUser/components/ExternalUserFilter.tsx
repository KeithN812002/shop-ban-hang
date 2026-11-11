import { memo, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { STATUS_OPTIONS } from '@/constants/options'
import { DEFAULT_EXTERNAL_USER_FORM_VALUES, type ExternalUserFilterForm } from '../hooks/useExternalUserFilters'
import { ExternalUserAdvancedFilter } from './ExternalUserAdvancedFilter'
import {
    useFilterTags,
    ActiveFilterTags,
    type FilterFieldConfig,
    FilterBar,
    AdvancedFilterTrigger,
} from '@workspace/ui/components/DataTable'

interface ExternalUserFilterProps {
    onSearch: (data: ExternalUserFilterForm) => void
    onReset: () => void
}

const ADVANCED_KEYS: readonly (keyof ExternalUserFilterForm | readonly (keyof ExternalUserFilterForm)[])[] = [
    'email',
    'externalUnitCode',
    'createdDateRange',
    'createdBy',
    'updatedDateRange',
    'updatedBy',
]

export const ExternalUserFilter = memo(({ onSearch, onReset }: ExternalUserFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<ExternalUserFilterForm>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [appliedValues, setAppliedValues] = useState<ExternalUserFilterForm | null>(null)

    const handleFormSearch = (data: ExternalUserFilterForm) => {
        onSearch(data)
        setAppliedValues(data)
    }

    const filterConfig: FilterFieldConfig<ExternalUserFilterForm>[] = useMemo(
        () => [
            { key: 'userName', label: t('common.fields.userName') },
            { key: 'personalName', label: t('common.fields.personalName') },
            { key: 'email', label: t('common.fields.email') },
            {
                key: 'status',
                label: t('common.status'),
                type: 'select',
                options: STATUS_OPTIONS,
                isTranslation: true,
            },
            { key: 'externalUnitCode', label: t('user.fields.externalUnitCode') },
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
        defaultValues: DEFAULT_EXTERNAL_USER_FORM_VALUES,
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
                    <ExternalUserAdvancedFilter
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
        </FilterBar>
    )
})

ExternalUserFilter.displayName = 'ExternalUserFilter'
