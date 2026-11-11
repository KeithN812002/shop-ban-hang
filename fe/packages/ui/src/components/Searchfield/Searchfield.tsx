'use client'

import { FieldGroup } from '@workspace/ui/components/Field'
import { SearchIcon, XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
    Button as AriaButton,
    ButtonProps as AriaButtonProps,
    Input as AriaInput,
    InputProps as AriaInputProps,
    SearchField as AriaSearchField,
    SearchFieldProps as AriaSearchFieldProps,
    composeRenderProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'
import type { BsSearchFieldProps } from './Searchfield.types'

function SearchField({ className, ...props }: AriaSearchFieldProps) {
    return (
        <AriaSearchField
            aria-label="Search"
            className={composeRenderProps(className, className => cn('group', className))}
            {...props}
        />
    )
}

function SearchFieldInput({ className, ...props }: AriaInputProps) {
    return (
        <AriaInput
            aria-label="Search"
            className={composeRenderProps(className, className =>
                cn(
                    'min-w-0 flex-1 px-2 py-1.5 outline outline-0 placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden',
                    'group-data-[invalid]:placeholder:text-destructive/60 group-data-[invalid]:text-destructive',
                    className,
                ),
            )}
            {...props}
        />
    )
}

function SearchFieldClear({ className, ...props }: AriaButtonProps) {
    return (
        <AriaButton
            excludeFromTabOrder
            className={composeRenderProps(className, className =>
                cn(
                    'rounded-sm opacity-70 ring-offset-background transition-opacity',
                    /* Hover */
                    'data-[hovered]:opacity-100',
                    /* Disabled */
                    'data-[disabled]:pointer-events-none',
                    /* Empty */
                    'group-data-[empty]:invisible',
                    'group-data-[invalid]:text-destructive group-data-[invalid]:opacity-100',
                    className,
                ),
            )}
            {...props}
        />
    )
}

function BsSearchField({
    className,
    placeholder,
    containerClassName,
    isInvalid,
    ...props
}: BsSearchFieldProps & { isInvalid?: boolean }) {
    const { t } = useTranslation()
    const resolvedPlaceholder = placeholder ?? t('common.search')

    return (
        <SearchField
            aria-label={resolvedPlaceholder}
            className={cn('group flex flex-col gap-2', containerClassName)}
            isInvalid={isInvalid}
            {...props}
        >
            <FieldGroup
                data-invalid={isInvalid ? true : undefined}
                aria-invalid={isInvalid}
                className={() => cn('px-2', className)}
            >
                <SearchIcon
                    aria-hidden
                    className={cn('size-4 text-muted-foreground pointer-events-none', isInvalid && 'text-destructive')}
                />
                <SearchFieldInput placeholder={resolvedPlaceholder} />
                <SearchFieldClear>
                    <XIcon aria-hidden className="size-4" />
                </SearchFieldClear>
            </FieldGroup>
        </SearchField>
    )
}

export { BsSearchField, SearchField, SearchFieldClear, SearchFieldInput }
