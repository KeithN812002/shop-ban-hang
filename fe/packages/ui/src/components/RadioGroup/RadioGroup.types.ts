import type { RadioGroupProps as AriaRadioGroupProps } from 'react-aria-components'

export interface BsRadioGroupOption {
    id: string
    name: string
    isDisabled?: boolean
}

export interface BsRadioGroupProps<T extends Record<string, any> = BsRadioGroupOption> extends Omit<
    AriaRadioGroupProps,
    'onChange'
> {
    options: Array<T>

    /**
     * The key of the option object to use as the unique value. Default: 'id'
     */
    valueKey?: string

    /**
     * The key of the option object to use as the display label. Default: 'name'
     */
    labelKey?: string

    /**
     * Value mode determines what onChange emits:
     * - 'simple' (default): emits the value string — backward compatible
     * - 'object': emits the full option object T
     */
    valueMode?: 'simple' | 'object'

    /**
     * Callback when selection changes.
     * - simple: (value: string) => void
     * - object: (item: T) => void
     */
    onChange?: (value: any) => void
}
