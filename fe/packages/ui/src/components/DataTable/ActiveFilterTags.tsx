import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { X, ArrowRight } from 'lucide-react'

export interface FilterFieldConfig<T = any> {
    key: keyof T
    partnerKey?: keyof T
    label: string
    type?: 'text' | 'select' | 'date-range' | 'date' | 'boolean' | 'flag'
    options?: readonly any[]
    valueKey?: string
    labelKey?: string
    isTranslation?: boolean
}

interface ActiveFilterTagsProps<T = any> {
    appliedValues: T | null
    config: FilterFieldConfig<T>[]
    onRemove: (key: keyof T) => void
    onClear: () => void
    dateFormatter?: (date: any) => string
}

export const ActiveFilterTags = <T extends Record<string, any>>({
    appliedValues,
    config,
    onRemove,
    onClear,
    dateFormatter = date => new Date(date).toLocaleDateString('vi-VN'),
}: ActiveFilterTagsProps<T>) => {
    const { t } = useTranslation()

    const activeFilters = useMemo(() => {
        if (!appliedValues) return []
        const filters: { key: keyof T; label: string; displayValue: ReactNode; title?: string }[] = []

        const getOptionLabel = (value: any, options: readonly any[], valueKey = 'value', labelKey = 'label') => {
            const option = options.find(opt => opt[valueKey] === value)
            return option ? option[labelKey] : value
        }

        const formatArrayLabels = (items: any[], formatter: (v: any) => string) => {
            if (!items || items.length === 0) return { text: '', full: '' }
            const labels = items.map(formatter).filter(Boolean)
            const full = labels.join(', ')
            if (labels.length > 3) {
                return { text: `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`, full }
            }
            return { text: full, full }
        }

        config.forEach(field => {
            // Skip partnerKey if it was already processed as a partner of another field
            if (config.some(f => f.partnerKey === field.key)) {
                return
            }

            const value = appliedValues[field.key]
            const partnerValue = field.partnerKey ? appliedValues[field.partnerKey] : undefined

            const hasValue =
                value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
            const hasPartnerValue = partnerValue !== undefined && partnerValue !== null && partnerValue !== ''

            if (!hasValue && !hasPartnerValue) return

            if (field.type === 'flag') {
                if (value) {
                    filters.push({ key: field.key, label: field.label, displayValue: null })
                }
                return
            }

            let displayValue: ReactNode = ''
            let title: string | undefined
            if (field.type === 'date-range') {
                if (value && value.start) {
                    const start = dateFormatter(value.start)
                    const end = dateFormatter(value.end)
                    displayValue = (
                        <span className="inline-flex items-center gap-1">
                            <span>{start}</span>
                            <ArrowRight className="size-3 opacity-60 flex-shrink-0" />
                            <span>{end}</span>
                        </span>
                    )
                }
            } else if (field.partnerKey) {
                const startStr = hasValue ? String(value) : ''
                const endStr = hasPartnerValue ? String(partnerValue) : ''
                displayValue = (
                    <span className="inline-flex items-center gap-1">
                        <span>{startStr}</span>
                        <ArrowRight className="size-3 opacity-60 flex-shrink-0" />
                        <span>{endStr}</span>
                    </span>
                )
            } else if (field.type === 'select') {
                if (Array.isArray(value)) {
                    const formatted = formatArrayLabels(value, v => {
                        const label = getOptionLabel(
                            v,
                            field.options || [],
                            field.valueKey || 'value',
                            field.labelKey || 'label',
                        )
                        return field.isTranslation ? t(label as any) : label
                    })
                    displayValue = formatted.text
                    title = formatted.full !== formatted.text ? formatted.full : undefined
                } else {
                    const label = getOptionLabel(
                        value,
                        field.options || [],
                        field.valueKey || 'value',
                        field.labelKey || 'label',
                    )
                    displayValue = field.isTranslation ? t(label as any) : label
                }
            } else if (field.type === 'date') {
                displayValue = dateFormatter(value)
            } else if (field.type === 'boolean') {
                displayValue = value ? t('common.yes' as any) : t('common.no' as any)
            } else {
                displayValue = String(value)
            }

            if (displayValue) {
                filters.push({ key: field.key, label: field.label, displayValue, title })
            }
        })

        return filters
    }, [appliedValues, config, t, dateFormatter])

    if (activeFilters.length === 0) return null

    return (
        <div className="active-filter-tags-container flex flex-wrap gap-2 items-center px-1">
            {activeFilters.map(filter => (
                <Badge
                    key={String(filter.key)}
                    variant="secondary"
                    title={filter.title ? `${filter.label}: ${filter.title}` : undefined}
                    className="pl-2.5 pr-1.5 py-0.5 h-7 rounded flex items-center gap-1 border-primary/20 bg-primary/5 text-primary"
                >
                    {filter.displayValue === null ? (
                        <span className="text-[11px] font-semibold whitespace-nowrap">{filter.label}</span>
                    ) : (
                        <>
                            <span className="font-medium opacity-70 text-[11px] whitespace-nowrap">
                                {filter.label}:
                            </span>
                            <span className="text-[11px] font-semibold whitespace-nowrap">{filter.displayValue}</span>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-4 rounded-full hover:bg-primary/20 hover:text-primary p-0 ml-1 transition-colors"
                        onPress={() => onRemove(filter.key)}
                        aria-label={t('common.removeFilter' as any, { label: filter.label })}
                    >
                        <X className="size-2.5" />
                    </Button>
                </Badge>
            ))}
            <Button
                variant="link"
                size="sm"
                onPress={onClear}
                className="text-muted-foreground h-7 hover:text-primary transition-colors"
            >
                {t('common.clear' as any)}
            </Button>
        </div>
    )
}
