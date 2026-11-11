import { memo, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { BsInput } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { DEFAULT_ROLE_FORM_VALUES, type RoleFilterForm } from '../hooks/useRoleFilters'
import { RoleAdvancedFilter } from './RoleAdvancedFilter'
import {
    useFilterTags,
    FilterBar,
    AdvancedFilterTrigger,
    ActiveFilterTags,
    type FilterFieldConfig,
} from '@workspace/ui/components/DataTable'
import { STATUS_OPTIONS } from '@/constants/options'

interface RoleFilterProps {
    onSearch: (data: RoleFilterForm) => void
    onReset: () => void
}

const ADVANCED_KEYS: readonly (keyof RoleFilterForm | readonly (keyof RoleFilterForm)[])[] = [
    'createdDateRange',
    'createdBy',
    'updatedDateRange',
    'updatedBy',
]

export const RoleFilter = memo(({ onSearch, onReset }: RoleFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<RoleFilterForm>()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [appliedValues, setAppliedValues] = useState<RoleFilterForm | null>(null)

    const handleFormSearch = (data: RoleFilterForm) => {
        onSearch(data)
        setAppliedValues(data)
    }

    const filterConfig: FilterFieldConfig<RoleFilterForm>[] = useMemo(
        () => [
            { key: 'code', label: t('role.fields.code') },
            { key: 'name', label: t('role.fields.name') },
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
        [t],
    )

    const { activeAdvancedCount, removeFilter } = useFilterTags({
        advancedKeys: ADVANCED_KEYS,
        appliedValues,
        defaultValues: DEFAULT_ROLE_FORM_VALUES,
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
                    <RoleAdvancedFilter
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
        </FilterBar>
    )
})

RoleFilter.displayName = 'RoleFilter'
