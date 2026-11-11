'use client'

import React from 'react'
import {
    Dialog as AriaDialog,
    DialogProps as AriaDialogProps,
    DialogTrigger as AriaDialogTrigger,
    Popover as AriaPopover,
    PopoverProps as AriaPopoverProps,
    composeRenderProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'
import type { PopoverExtraProps } from './Popover.types'

const PopoverTrigger = AriaDialogTrigger

// ─── Popover component ────────────────────────────────────────────

const Popover = React.forwardRef<HTMLDivElement, AriaPopoverProps & PopoverExtraProps>(
    ({ className, offset = 4, isAnimated = true, shouldAllowBackgroundScroll = false, ...props }, forwardedRef) => {
        const cleanupRef = React.useRef<(() => void) | null>(null)

        const callbackRef = React.useCallback(
            (node: HTMLDivElement | null) => {
                // Forward the ref
                if (typeof forwardedRef === 'function') forwardedRef(node)
                else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node

                // Cleanup previous
                cleanupRef.current?.()
                cleanupRef.current = null

                if (!node || !shouldAllowBackgroundScroll) return

                // Remove `inert` from all elements set by React Aria.
                // React Aria's ariaHideOutside sets `inert` on siblings of the
                // overlay portal, which can be at any level up to <body>.
                const removeAllInert = () => {
                    document.querySelectorAll('[inert]').forEach(el => {
                        // Don't remove inert from the popover itself or its children
                        if (node.contains(el)) return
                        el.removeAttribute('inert')
                    })
                }

                removeAllInert()

                // Watch for React Aria re-adding inert (debounced via microtask)
                const observer = new MutationObserver(() => removeAllInert())
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['inert'],
                    subtree: true,
                })

                cleanupRef.current = () => observer.disconnect()
            },
            [forwardedRef, shouldAllowBackgroundScroll],
        )

        // Cleanup on unmount
        React.useEffect(() => {
            return () => {
                cleanupRef.current?.()
                cleanupRef.current = null
            }
        }, [])

        return (
            <AriaPopover
                ref={callbackRef}
                offset={offset}
                className={composeRenderProps(className, className =>
                    cn(
                        'z-50 rounded-lg border bg-popover/80 backdrop-blur-xl text-popover-foreground shadow-popover outline-none',
                        /* Entering */
                        isAnimated && 'data-[entering]:animate-in data-[entering]:fade-in-0',
                        /* Exiting */
                        isAnimated && 'data-[exiting]:animate-out data-[exiting]:fade-out-0',
                        /* Placement */
                        'data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2',
                        className,
                    ),
                )}
                {...props}
            />
        )
    },
)
Popover.displayName = 'Popover'

function PopoverDialog({ className, ...props }: AriaDialogProps) {
    return <AriaDialog className={cn('p-3 outline outline-0', className)} {...props} />
}

export { Popover, PopoverDialog, PopoverTrigger }
