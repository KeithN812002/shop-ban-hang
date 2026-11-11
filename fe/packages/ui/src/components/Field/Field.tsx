'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
    Group as AriaGroup,
    GroupProps as AriaGroupProps,
    Label as AriaLabel,
    LabelProps as AriaLabelProps,
    composeRenderProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'

const labelVariants = cva([
    'text-sm font-medium',
    /* Disabled */
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
    /* Invalid */
    'data-[invalid]:text-destructive',
])

const Label = ({ className, ...props }: AriaLabelProps) => (
    <AriaLabel className={cn(labelVariants(), className)} {...props} />
)

const fieldGroupVariants = cva('', {
    variants: {
        variant: {
            default: [
                'shadow-sm bg-background relative flex h-8 w-full items-center overflow-hidden rounded-sm px-3 py-2 md:text-sm',
                'ring-inset ring ring-input',
                /* Focus Within */
                'transition-all data-[focus-within]:ring-primary data-[focus-within]:ring-2 data-[focus-within]:bg-primary/5',
                /* Disabled */
                'data-[disabled]:bg-muted data-[disabled]:text-muted-foreground',
                /* Invalid */
                'aria-invalid:ring-destructive! aria-invalid:ring-2! data-[invalid]:ring-destructive! data-[invalid]:ring-2! data-[invalid]:bg-destructive/10',
            ],

            ghost: '',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
})

interface GroupProps extends AriaGroupProps, VariantProps<typeof fieldGroupVariants> {
    isInvalid?: boolean
}

const FieldGroup = React.forwardRef<HTMLDivElement, GroupProps>(({ className, variant, isInvalid, ...props }, ref) => {
    return (
        <AriaGroup
            ref={ref}
            data-invalid={isInvalid || undefined}
            aria-invalid={isInvalid || undefined}
            className={composeRenderProps(className, className =>
                cn(
                    fieldGroupVariants({ variant }),
                    isInvalid && 'ring-2! ring-destructive! border-transparent! bg-destructive/10! text-destructive!',
                    className,
                ),
            )}
            {...props}
        />
    )
})
FieldGroup.displayName = 'FieldGroup'

export { FieldGroup, fieldGroupVariants, Label, labelVariants }
