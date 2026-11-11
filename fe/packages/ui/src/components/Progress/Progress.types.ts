import type { ProgressBarProps as AriaProgressBarProps } from 'react-aria-components'

export interface ProgressProps extends AriaProgressBarProps {
    barClassName?: string
    fillClassName?: string
}

export interface BsProgressBarProps extends ProgressProps {
    label?: string
    showValue?: boolean
}
