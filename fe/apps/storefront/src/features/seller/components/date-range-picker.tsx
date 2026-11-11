import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-controls'
import type { DateRangeParams } from '../types'
import { rangeLastDays, rangeThisMonth } from '../lib/dates'

interface DateRangePickerProps {
    value: DateRangeParams
    onChange: (range: DateRangeParams) => void
}

/** From/to date inputs with quick presets; keeps from <= to by clamping the other end. */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1 text-xs text-gray-600">
                <span>{t('seller.common.fromDate')}</span>
                <Input
                    type="date"
                    className="w-40"
                    value={value.fromDate}
                    max={value.toDate}
                    onChange={event => event.target.value && onChange({ ...value, fromDate: event.target.value })}
                />
            </label>
            <label className="space-y-1 text-xs text-gray-600">
                <span>{t('seller.common.toDate')}</span>
                <Input
                    type="date"
                    className="w-40"
                    value={value.toDate}
                    min={value.fromDate}
                    onChange={event => event.target.value && onChange({ ...value, toDate: event.target.value })}
                />
            </label>
            <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => onChange(rangeLastDays(7))}>
                    {t('seller.common.last7')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onChange(rangeLastDays(30))}>
                    {t('seller.common.last30')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onChange(rangeThisMonth())}>
                    {t('seller.common.thisMonth')}
                </Button>
            </div>
        </div>
    )
}
