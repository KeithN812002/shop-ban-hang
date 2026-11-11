'use client'

import * as React from 'react'

import { Check, ChevronRight, Circle } from 'lucide-react'
import {
    Header as AriaHeader,
    Keyboard as AriaKeyboard,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuItemProps as AriaMenuItemProps,
    MenuProps as AriaMenuProps,
    MenuTrigger as AriaMenuTrigger,
    Separator as AriaSeparator,
    SeparatorProps as AriaSeparatorProps,
    SubmenuTrigger as AriaSubmenuTrigger,
    composeRenderProps,
    PopoverProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'

import { ListBoxCollection, ListBoxSection } from '@workspace/ui/components/ListBox'
import { Popover } from '@workspace/ui/components/Popover'
import type { MenuHeaderProps } from './Menu.types'

const MenuTrigger = AriaMenuTrigger

const MenuSubTrigger = AriaSubmenuTrigger

const MenuSection = ListBoxSection

const MenuCollection = ListBoxCollection

function MenuPopover({ className, ...props }: PopoverProps) {
    return <Popover className={composeRenderProps(className, className => cn('w-auto', className))} {...props} />
}

const Menu = <T extends object>({ className, 'aria-label': ariaLabel, ...props }: AriaMenuProps<T>) => (
    <AriaMenu
        className={cn(
            'max-h-[inherit] overflow-auto rounded-md p-1.5 outline outline-0 [clip-path:inset(0_0_0_0_round_calc(var(--radius)-2px))]',
            className,
        )}
        aria-label={ariaLabel || 'Menu'}
        {...props}
    />
)

const MenuItem = ({ children, className, ...props }: AriaMenuItemProps) => (
    <AriaMenuItem
        textValue={props.textValue || (typeof children === 'string' ? children : undefined)}
        className={composeRenderProps(className, className =>
            cn(
                'relative flex cursor-default select-none items-center gap-2.5 rounded-sm py-1.5 px-2 text-sm outline-none',
                /* Disabled */
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                /* Focused */
                'data-[focused]:bg-primary data-[focused]:text-white',
                /* Selection Mode */
                'data-[selection-mode]:pl-8',
                className,
            ),
        )}
        {...props}
    >
        {composeRenderProps(children, (children, renderProps) => (
            <>
                <span className="absolute left-2 flex size-4 items-center justify-center">
                    {renderProps.isSelected && (
                        <>
                            {renderProps.selectionMode == 'single' && <Circle className="size-2 fill-current" />}
                            {renderProps.selectionMode == 'multiple' && <Check className="size-4" />}
                        </>
                    )}
                </span>

                {children}

                {renderProps.hasSubmenu && <ChevronRight className="ml-auto size-4" />}
            </>
        ))}
    </AriaMenuItem>
)

const MenuHeader = ({ className, inset, separator = true, ...props }: MenuHeaderProps) => (
    <AriaHeader
        className={cn(
            'px-3 py-1.5 text-sm font-semibold',
            inset && 'pl-8',
            separator && '-mx-1 mb-1 border-b border-b-border pb-2.5',
            className,
        )}
        {...props}
    />
)

const MenuSeparator = ({ className, ...props }: AriaSeparatorProps) => (
    <AriaSeparator className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
)

const MenuKeyboard = ({ className, ...props }: React.ComponentProps<typeof AriaKeyboard>) => {
    return <AriaKeyboard className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
}

export {
    MenuTrigger,
    Menu,
    MenuPopover,
    MenuItem,
    MenuHeader,
    MenuSeparator,
    MenuKeyboard,
    MenuSection,
    MenuSubTrigger,
    MenuCollection,
}
