'use client'

import React, { useEffect, useRef } from 'react'
import type { TFunction } from 'i18next'
import { useFormContext, type FieldValues } from 'react-hook-form'
import { DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Separator } from '@workspace/ui/components/Separator'
import { Search, X } from 'lucide-react'
import { trimFormStrings } from './useFilterTags'

export interface AdvancedFilterContentProps {
    isOpen: boolean
    onClose: () => void
    onApply: () => void
    title: string
    children: React.ReactNode
    isPending?: boolean
    t?: TFunction
    className?: string
}

export const AdvancedFilterContent = ({
    isOpen,
    onClose,
    onApply,
    title,
    children,
    isPending,
    t,
    className,
}: AdvancedFilterContentProps) => {
    const formContext = useFormContext()
    const snapshotRef = useRef<FieldValues | null>(null)

    const getValues = formContext?.getValues

    useEffect(() => {
        if (isOpen && getValues) {
            snapshotRef.current = getValues()
        }
    }, [isOpen, getValues])

    const handleCancel = () => {
        if (formContext && snapshotRef.current) {
            formContext.reset(snapshotRef.current, { keepDefaultValues: true })
        }
        snapshotRef.current = null
        onClose()
    }

    const handleApply = async () => {
        trimFormStrings(formContext)
        if (formContext) {
            const isValid = await formContext.trigger()
            if (!isValid) return
        }
        snapshotRef.current = null
        onApply()
        onClose()
    }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
        void handleApply()
    }

    return (
        <DialogContent
            isOpen={isOpen}
            onOpenChange={open => !open && handleCancel()}
            isDismissable={false}
            className={className || 'max-w-6xl'}
            dialogClassName="gap-0"
            aria-labelledby="advanced-filter-title"
        >
            <DialogHeader className="pb-4">
                <DialogTitle id="advanced-filter-title" className="flex items-center gap-2">
                    {title}
                </DialogTitle>
            </DialogHeader>

            <Separator className="-mx-5 w-auto" />

            <form className="contents" noValidate onSubmit={handleFormSubmit}>
                <DialogBody className="space-y-6 py-4">{children}</DialogBody>

                <Separator className="-mx-5 w-auto" />

                <DialogFooter className="pt-4">
                    <div className="flex justify-end items-center w-full gap-2">
                        <Button type="submit" isDisabled={isPending}>
                            <Search className="size-4" />
                            {t ? t('common.apply') : 'common.apply'}
                        </Button>
                        <Button variant="outline" onPress={handleCancel} isDisabled={isPending}>
                            <X className="size-4" />
                            {t ? t('common.close') : 'common.close'}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
