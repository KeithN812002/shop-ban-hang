import type { CheckboxGroupProps as AriaCheckboxGroupProps } from 'react-aria-components'

export interface BsCheckboxGroupOption {
    id: string
    name: string
}

export interface BsCheckboxProps<T extends Record<string, any> = BsCheckboxGroupOption> extends Omit<
    AriaCheckboxGroupProps,
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
     * - 'simple' (default): emits string[] — backward compatible
     * - 'object': emits T[] (full option objects)
     */
    valueMode?: 'simple' | 'object'

    /**
     * Callback when selection changes.
     * - simple: (values: string[]) => void
     * - object: (items: T[]) => void
     */
    onChange?: (value: any) => void
}
