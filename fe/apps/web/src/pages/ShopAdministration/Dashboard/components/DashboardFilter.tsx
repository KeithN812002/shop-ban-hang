import { memo } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsDateRangePicker } from '@workspace/ui/components/DatePicker'
import { FilterBar } from '@workspace/ui/components/DataTable'
import { cn } from '@workspace/ui/lib/utils'
import { GROUP_BY_LABEL, GROUP_BY_OPTIONS } from '../../constants'
import type { DashboardFilterForm } from '../hooks/useDashboardPage'

const GroupByToggle = memo(() => {
    const { t } = useTranslation()
    const { field } = useController<DashboardFilterForm, 'groupBy'>({ name: 'groupBy' })

    return (
        <div className="space-y-1">
            <span id="dashboard-group-by" className="text-sm font-medium">
                {t('shopAdmin.dashboard.groupBy.label')}
            </span>
            <div
                role="radiogroup"
                aria-labelledby="dashboard-group-by"
                className="inline-flex h-8 w-full items-center rounded-md bg-muted p-0.5"
            >
                {GROUP_BY_OPTIONS.map(option => {
                    const isSelected = field.value === option
                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => field.onChange(option)}
                            className={cn(
                                'h-7 flex-1 cursor-pointer rounded px-3 text-sm font-medium transition-colors outline-none',
                                'focus-visible:ring-2 focus-visible:ring-ring',
                                isSelected
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t(GROUP_BY_LABEL[option])}
                        </button>
                    )
                })}
            </div>
        </div>
    )
})
GroupByToggle.displayName = 'GroupByToggle'

interface DashboardFilterProps {
    onSearch: (data: DashboardFilterForm) => void
    onReset: () => void
}

export const DashboardFilter = memo(({ onSearch, onReset }: DashboardFilterProps) => {
    const { t } = useTranslation()
    const { handleSubmit } = useFormContext<DashboardFilterForm>()

    return (
        <FilterBar onSubmit={handleSubmit(onSearch)} onReset={onReset} t={t}>
            <BsDateRangePicker label={t('shopAdmin.dashboard.dateRange')} name="dateRange" isRequired />
            <GroupByToggle />
        </FilterBar>
    )
})

DashboardFilter.displayName = 'DashboardFilter'
