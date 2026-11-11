import type { ToggleButtonProps as AriaToggleButtonProps } from 'react-aria-components'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from './Toggle'

export interface ToggleProps extends AriaToggleButtonProps, VariantProps<typeof toggleVariants> {}
