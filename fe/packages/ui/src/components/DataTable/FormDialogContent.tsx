'use client'

import React from 'react'
import type { TFunction } from 'i18next'
import { DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Separator } from '@workspace/ui/components/Separator'
import { X } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

export interface FormDialogContentProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    onSave?: (e?: React.BaseSyntheticEvent) => Promise<void>
    isPending?: boolean
    auditInfo?: React.ReactNode
    t?: TFunction
    className?: string
    bodyClassName?: string
    columns?: 1 | 2 | 3 | 4
    footer?: React.ReactNode
    closeLabel?: string
    closeIcon?: React.ElementType
}

export const FormDialogContent = ({
    isOpen,
    onClose,
    title,
    children,
    onSave,
    isPending,
    auditInfo,
    t,
    className,
    bodyClassName,
    columns = 2,
    footer,
    closeLabel,
    closeIcon: CloseIcon = X,
}: FormDialogContentProps) => {
    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    }[columns]

    return (
        <DialogContent
            isOpen={isOpen}
            onOpenChange={open => !open && onClose()}
            isDismissable={false}
            className={cn('max-w-2xl', className)}
            dialogClassName="gap-0"
        >
            <DialogHeader className="pb-4">
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>

            <Separator className="-mx-5 w-auto" />

            <form onSubmit={onSave} noValidate>
                <DialogBody className={cn('grid gap-4 py-4 relative min-h-[100px]', gridColsClass, bodyClassName)}>
                    {children}
                </DialogBody>

                {auditInfo && (
                    <>
                        <Separator className="-mx-5 w-auto" />
                        <div className="px-5 py-4">{auditInfo}</div>
                    </>
                )}

                <Separator className="-mx-5 w-auto" />

                <DialogFooter className="pt-4 flex justify-end gap-2 w-full">
                    {footer}
                    <Button variant="outline" onPress={onClose} isDisabled={isPending}>
                        <CloseIcon className="size-4" />
                        {closeLabel || (t ? t('common.close') : 'common.close')}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
