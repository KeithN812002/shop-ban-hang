'use client'

import React from 'react'
import { X } from 'lucide-react'
import {
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Heading as AriaHeading,
    HeadingProps as AriaHeadingProps,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    ModalOverlayProps as AriaModalOverlayProps,
    composeRenderProps,
} from 'react-aria-components'

import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/Button'

const Dialog = AriaDialog

const DialogTrigger = AriaDialogTrigger

import type { DialogContentProps } from './Dialog.types'
import { usePreventBodyScroll } from './Dialog.hooks'

function DialogOverlayInner({ className, isDismissable = true, ...props }: AriaModalOverlayProps) {
    usePreventBodyScroll(props.isOpen)

    return (
        <AriaModalOverlay
            isDismissable={isDismissable}
            data-dialog-overlay
            className={composeRenderProps(className, className =>
                cn(
                    'fixed inset-0 z-60 bg-black/70',
                    /* Exiting */
                    'data-[exiting]:animate-out max-md:data-[exiting]:duration-300 data-[exiting]:fade-out-0',
                    /* Entering */
                    'data-[entering]:animate-in max-md:data-[entering]:duration-300 data-[entering]:fade-in-0',
                    className,
                ),
            )}
            {...props}
        />
    )
}

const DialogOverlay = DialogOverlayInner

const DialogContent = ({
    className,
    children,
    role,
    closeButton = true,
    isOpen,
    onOpenChange,
    isDismissable,
    isFullscreenOnMobile: _,
    dialogClassName,
    ...props
}: DialogContentProps & { dialogClassName?: string }) => (
    <DialogOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable}>
        <AriaModal
            className={composeRenderProps(className, className =>
                cn(
                    // Position & size
                    'fixed left-[50vw] top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                    'w-full max-w-lg max-h-[calc(100dvh-40px)]',
                    // Layout: flex-col container, overflow-hidden enforces max-height
                    'flex flex-col overflow-hidden',
                    // Visual
                    'bg-background p-5 shadow-2xl rounded-xl dark:border',
                    // Animations
                    'data-[entering]:animate-in data-[exiting]:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0',
                    'md:data-[entering]:zoom-in-97 md:data-[exiting]:zoom-out-97',
                    'max-md:data-[exiting]:duration-300 max-md:data-[entering]:slide-in-from-bottom-5 max-md:data-[exiting]:slide-out-to-bottom-5',
                    className,
                ),
            )}
            {...props}
        >
            <AriaDialog
                role={role}
                className={cn(
                    'flex flex-col flex-1 min-h-0 gap-4 outline-none',
                    '[&>form]:flex [&>form]:flex-col [&>form]:flex-1 [&>form]:min-h-0',
                    dialogClassName,
                )}
            >
                {composeRenderProps(children, (children, renderProps) => (
                    <>
                        {children}
                        {closeButton && (
                            <Button
                                onClick={renderProps.close}
                                size="icon"
                                variant="ghost"
                                className="absolute right-2.5 top-2.5"
                            >
                                <X className="size-4! text-muted-foreground" />
                                <span className="sr-only">Close</span>
                            </Button>
                        )}
                    </>
                ))}
            </AriaDialog>
        </AriaModal>
    </DialogOverlay>
)

/** Fixed header — stays at top of modal, never scrolls */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col flex-shrink-0 space-y-1.5 text-center sm:text-left', className)} {...props} />
)

/** Scrollable content area — takes remaining height between header and footer */
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex-1 min-h-0 overflow-y-auto scrollbar-hide', className)} {...props} />
)

/** Fixed footer — stays at bottom of modal, never scrolls */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse flex-shrink-0 sm:flex-row sm:justify-end gap-2', className)} {...props} />
)

const DialogTitle = ({ className, ...props }: AriaHeadingProps) => (
    <AriaHeading
        slot="title"
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
        className={cn('flex flex-col space-y-1.5 text-center text-sm sm:text-left text-muted-foreground', className)}
        {...props}
    />
)

export {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
    DialogTrigger,
}
export type { DialogContentProps }
