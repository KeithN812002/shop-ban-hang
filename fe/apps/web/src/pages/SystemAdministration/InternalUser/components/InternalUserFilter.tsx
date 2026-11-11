import { memo, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { STATUS_OPTIONS, AUTHORIZATION_STATUS_OPTIONS } from '@/constants/options'
import { DEFAULT_INTERNAL_USER_FORM_VALUES, type InternalUserFilterForm } from '../hooks/useInternalUserFilters'
import { InternalUserAdvancedFilter } from './InternalUserAdvancedFilter'
import {
    useFilterTags,
    ActiveFilterTags,
    type FilterFieldConfig,
    FilterBar,
    AdvancedFilterTrigger,
} from '@workspace/ui/components/DataTable'

interface InternalUserFilterProps {
    onSearch: (data: InternalUserFilterForm) => void
    onReset: () => void
}

const ADVANCED_KEYS: readonly (keyof InternalUserFilterForm | readonly (keyof InternalUserFilterForm)[])[] = [
    'email',
    'createdDateRange',
    'createdBy',
    'updatedDateRange',
    'updatedBy',
    'unassignedRole',
]

export const InternalUserFilter = memo(({ onSearch, onReset }: InternalUserFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<InternalUserFilterForm>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [appliedValues, setAppliedValues] = useState<InternalUserFilterForm | null>(null)

    const handleFormSearch = (data: InternalUserFilterForm) => {
        onSearch(data)
        setAppliedValues(data)
    }

    const filterConfig: FilterFieldConfig<InternalUserFilterForm>[] = useMemo(
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
            {
                key: 'unassignedRole',
                label: t('user.fields.authorizationStatus'),
                type: 'select',
                options: AUTHORIZATION_STATUS_OPTIONS,
                isTranslation: true,
            },
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
        defaultValues: DEFAULT_INTERNAL_USER_FORM_VALUES,
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
                    <InternalUserAdvancedFilter
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

InternalUserFilter.displayName = 'InternalUserFilter'
