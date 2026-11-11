'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import {
    Tree as AriaTree,
    TreeItem as AriaTreeItem,
    TreeItemContent as AriaTreeItemContent,
    Button as AriaButton,
    Collection,
    type TreeItemProps as AriaTreeItemProps,
    type TreeItemRenderProps,
    type TreeProps as AriaTreeProps,
    composeRenderProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'
import type { TreeItemLayoutProps } from './Tree.types'
import { EmptyState } from '../EmptyState/EmptyState'

/**
 * Tree component – wrapper around react-aria Tree
 * Keeps visual language consistent with the rest of @workspace/ui components
 */
const Tree = <T extends object>({ className, renderEmptyState, ...props }: AriaTreeProps<T>) => {
    return (
        <AriaTree
            {...props}
            renderEmptyState={renderEmptyState ?? (() => <EmptyState variant="compact" />)}
            className={composeRenderProps(className, className =>
                cn(
                    'jolly-Tree group flex flex-col gap-0.5 rounded-md border bg-popover p-1 text-popover-foreground shadow-sm outline-none',
                    'data-[empty]:p-6 data-[empty]:text-center data-[empty]:text-sm text-muted-foreground',
                    className,
                ),
            )}
        />
    )
}

/**
 * TreeItem – shares the same API as react-aria TreeItem but includes
 * styles, chevron indicators, and keyboard focus treatments
 */
const TreeItem = <T extends object>({ className, children, ...props }: AriaTreeItemProps<T>) => {
    // Separate content children from Collection children (nested items)
    const childArray = React.Children.toArray(children)
    const collectionChildren: React.ReactNode[] = []
    const contentChildren: React.ReactNode[] = []

    childArray.forEach(child => {
        if (React.isValidElement(child) && child.type === Collection) {
            collectionChildren.push(child)
        } else {
            contentChildren.push(child)
        }
    })

    return (
        <AriaTreeItem
            {...props}
            textValue={props.textValue ?? (typeof children === 'string' ? children : undefined)}
            className={composeRenderProps(className, className =>
                cn(
                    'jolly-TreeItem group/tree relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                    /* Hover & Focus */
                    'data-[hovered]:bg-accent data-[hovered]:text-accent-foreground',
                    'data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-background',
                    /* Disabled */
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    className,
                ),
            )}
        >
            <AriaTreeItemContent>
                {(renderProps: TreeItemRenderProps) => (
                    <>
                        {renderProps.hasChildItems ? (
                            <AriaButton
                                slot="chevron"
                                aria-label={renderProps.isExpanded ? 'Collapse' : 'Expand'}
                                className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground transition hover:bg-muted"
                            >
                                <ChevronRight
                                    className={cn('size-4 transition-transform', renderProps.isExpanded && 'rotate-90')}
                                />
                            </AriaButton>
                        ) : (
                            <span className="size-4 shrink-0" />
                        )}
                        {contentChildren}
                    </>
                )}
            </AriaTreeItemContent>
            {collectionChildren}
        </AriaTreeItem>
    )
}

/**
 * Optional helper layout to render icons, descriptions, badges, etc.
 * Can be composed inside <TreeItem> render props for dynamic data.
 */
function TreeItemLayout({
    icon,
    iconComponent: IconComponent,
    iconClassName,
    title,
    description,
    meta,
    badge,
    trailing,
    className,
    children,
}: TreeItemLayoutProps) {
    return (
        <div className={cn('flex w-full items-center gap-2 pr-2', className)}>
            {IconComponent ? (
                <IconComponent className={cn('size-4 shrink-0 text-muted-foreground', iconClassName)} />
            ) : (
                (icon ?? <span className="size-4 shrink-0" />)
            )}

            <div className="flex min-w-0 flex-1 flex-col text-left">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{title}</span>
                    {badge}
                    {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
                {children}
            </div>

            {trailing && <div className="ml-auto flex items-center gap-1">{trailing}</div>}
        </div>
    )
}

export { Tree, TreeItem, TreeItemLayout }
