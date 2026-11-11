import type { FieldHighlightVariant } from '@workspace/ui/lib/fieldHighlight'

export interface BsDatePickerProps {
    value?: string
    onChange?: (value: string) => void
    defaultValue?: string
    className?: string
    minValue?: string
    maxValue?: string
    isDisabled?: boolean
    showTime?: boolean
    isInvalid?: boolean
    viewMode?: 'day' | 'month' | 'quarter' | 'year'
    fieldHighlight?: FieldHighlightVariant
    isClearable?: boolean
    autoFocus?: boolean
}

export interface BsDateRangePickerValue {
    start: string
    end: string
}

export /** Accepts values in the format YYYY-MM-DD */
interface BsDateRangePickerProps {
    value?: BsDateRangePickerValue
    onChange?: (value: BsDateRangePickerValue) => void
    defaultValue?: BsDateRangePickerValue
    className?: string
    variant?: 'default' | 'unstyled'
    minValue?: string
    maxValue?: string
    isDisabled?: boolean
    isInvalid?: boolean
}
