import type { ButtonProps as AriaButtonProps } from 'react-aria-components'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from './Button'

export interface ButtonProps
    extends AriaButtonProps, React.RefAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean
}
