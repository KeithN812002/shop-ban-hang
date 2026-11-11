import type { SelectProps, PopoverProps } from 'react-aria-components'
import type { Control, RegisterOptions } from 'react-hook-form'
import type React from 'react'
import type { FieldHighlightVariant } from '@workspace/ui/lib/fieldHighlight'

export interface BsSelectMappedOption {
    id: string | number
    name: string
}

export interface BsTreeSelectNode {
    id: string | number
    name: string
    type?: string
    children?: BsTreeSelectNode[]
}

export interface BsSelectProps<
    T extends Record<string, any> = BsSelectMappedOption,
    M extends 'single' | 'multiple' = 'single',
> extends Omit<SelectProps<BsSelectMappedOption, M>, 'children' | 'onChange' | 'items' | 'value' | 'defaultValue'> {
    /**
     * The array of options to display in the select dropdown.
     */
    options?: Iterable<T>

    /**
     * Tree data for tree select mode.
     */
    treeData?: BsTreeSelectNode[]

    /**
     * Enable tree select mode.
     */
    isTree?: boolean

    /**
     * The key of the option object to use as the unique value/id. Default: 'id'
     */
    valueKey?: string

    /**
     * The key of the option object to use as the display label. Default: 'name'
     */
    labelKey?: string

    /**
     * Value mode determines what onChange emits:
     * - 'simple' (default): emits the key (string | number) — backward compatible
     * - 'object': emits the full option object T (single) or T[] (multiple)
     */
    valueMode?: 'simple' | 'object'

    /**
     * The currently selected value (single select mode).
     * Accepts the value corresponding to the valueKey of an option.
     */
    selectedValue?: string | number | null

    /**
     * The currently selected values (multiple select mode).
     * Accepts a Set or Iterable of values corresponding to the valueKey of options.
     */
    selectedValues?: 'all' | Iterable<string | number>

    /**
     * The default selected value (single select, uncontrolled).
     */
    defaultSelectedValue?: string | number

    /**
     * Callback when selection changes.
     * - simple + single: (value: string | number | null) => void
     * - simple + multiple: (values: Selection) => void
     * - object + single: (item: T | null) => void
     * - object + multiple: (items: T[]) => void
     */
    onChange?: (value: any) => void

    /**
     * If true, the trigger becomes a text input that filters options as the user types.
     * In tree mode, a search field is shown inside the popover instead.
     */
    isSearchable?: boolean

    /**
     * Custom render function for the selected value display.
     */
    renderValue?: (value: T) => React.ReactNode

    /**
     * Custom render function for each option in the dropdown.
     */
    renderOption?: (item: T) => React.ReactNode

    /**
     * The maximum number of badges to display. To show all badges, set to Infinity.
     */
    maxVisibleBadges?: number

    /**
     * If true, the clear button will be shown.
     */
    isClearable?: boolean

    /**
     * The class name of the select.
     */
    className?: string

    /**
     * The class name of the popover.
     */
    popoverClassName?: string

    /**
     * The placement of the popover relative to the trigger.
     */
    popoverPlacement?: PopoverProps['placement']

    /**
     * The message to display when there are no options found.
     */
    emptyMessage?: string

    /**
     * If true, skips automatic translation of option labels.
     */
    skipTranslation?: boolean
    /**
     * Lifted state for popover open status.
     */
    isOpen?: boolean
    /**
     * Lifted state setter for popover open status.
     */
    setIsOpen?: (open: boolean) => void
    /**
     * Lifted state for focus status.
     */
    isFocused?: boolean
    /**
     * Lifted state setter for focus status.
     */
    setIsFocused?: (focused: boolean) => void
    /** Visual highlight for diff/read-only comparison views. */
    fieldHighlight?: FieldHighlightVariant
}

export type BsSelectFieldProps<
    T extends Record<string, any> = BsSelectMappedOption,
    M extends 'single' | 'multiple' = 'single',
> = BsSelectProps<T, M> & {
    /** Label text rendered above the select. */
    label?: string
    /** Shows required indicator (*) next to the label. */
    isRequired?: boolean
    /** Error message below the select. In form mode, auto-populated from validation. */
    errorMessage?: string
    /** react-hook-form field name. Enables form mode with auto Controller binding. */
    name?: string
    /** react-hook-form control instance. Required with name for form mode. */
    control?: Control<any>
    /** Additional react-hook-form rules merged with auto rules (required, etc.). */
    rules?: RegisterOptions
    /** Optional class name for the outer container. */
    containerClassName?: string
    /** Visual highlight for diff/read-only comparison views. */
    fieldHighlight?: FieldHighlightVariant
    /** Hint text shown below the field (e.g. previous value). */
    highlightMessage?: string
}
