'use client'

import React from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { BsNumberFieldCore } from '../Numberfield/Numberfield'
import type { BsNumberFieldProps } from '../Numberfield/Numberfield.types'

export const TableNumberInput = React.forwardRef<HTMLInputElement, BsNumberFieldProps>(
    ({ className, showStepper = true, placeholder, onChange, value, ...props }, ref) => {
        return (
            <BsNumberFieldCore
                ref={ref}
                aria-label="Table Number Input"
                showStepper={showStepper}
                placeholder={placeholder}
                className={cn('w-full', className)}
                hasError={false}
                value={value as any}
                onChangeValue={val => (props as any).onChange?.(val) || (onChange as any)?.(val)}
                {...props}
            />
        )
    },
)

TableNumberInput.displayName = 'TableNumberInput'
