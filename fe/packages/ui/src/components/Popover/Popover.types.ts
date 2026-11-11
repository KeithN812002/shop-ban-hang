export interface PopoverExtraProps {
    isAnimated?: boolean
    /**
     * When true, removes all `inert` attributes that React Aria sets on
     * sibling elements of the overlay portal, allowing the scroll container
     * to remain interactive while the modal popover is open.
     */
    shouldAllowBackgroundScroll?: boolean
}
