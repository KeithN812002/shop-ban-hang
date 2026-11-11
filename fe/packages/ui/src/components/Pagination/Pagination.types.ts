export interface PaginationProps {
    /**
     * The current page, starting from 1
     */
    value?: number

    /**
     * The function to call when the page index changes
     */
    onChange?: (value: number) => void

    /**
     * The total number of pages
     */
    pageCount: number
    /**
     * Whether the pagination is disabled
     */
    isDisabled?: boolean
}

export interface PaginationPageSizeSelectorProps {
    /**
     * The currently selected value (controlled).
     */
    value?: number

    /**
     * Callback fired when the value changes.
     */
    onChange?: (value: number) => void

    /**
     * The default value (uncontrolled).
     */
    defaultValue?: number

    /**
     * The list of selectable options.
     */
    options?: number[]

    /**
     * Optional label displayed next to selector.
     */
    label?: React.ReactNode
    /**
     * Whether the selector is disabled
     */
    isDisabled?: boolean
}
