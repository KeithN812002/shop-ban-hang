'use client'

import { Button } from '@workspace/ui/components/Button'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/Dialog'
import { createStore } from '@xstate/store'
import { useSelector } from '@xstate/store/react'
import { Check, CircleXIcon, InfoIcon, Trash2, X, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isValidElement, useEffect, useState } from 'react'
import type { ConfirmDialogContext } from './ConfirmDialog.types'

const confirmStore = createStore({
    context: {
        isOpen: false,
    } as ConfirmDialogContext,
    on: {
        open: (_, data: ConfirmDialogContext['data']) => ({
            isOpen: true,
            data,
        }),
        close: context => ({ ...context, isOpen: false }),
    },
})

const { open, close } = confirmStore.trigger

const confirm = (data: ConfirmDialogContext['data']) => {
    if (!data) return

    open(data)
}

function ConfirmDialog() {
    const { t } = useTranslation()
    const isOpen = useSelector(confirmStore, state => state.context.isOpen)
    const data = useSelector(confirmStore, state => state.context.data)
    const variant = data?.variant || 'default'

    const ActionIcon = data?.action?.icon as any
    const CancelIcon = data?.cancel?.icon as any

    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
        if (!isOpen) setIsRunning(false)
    }, [isOpen])

    const handleCancel = () => {
        if (isRunning) return
        data?.cancel?.onClick?.()
        close()
    }

    const handleAction = () => {
        if (isRunning) return

        const result = data?.action?.onClick?.()
        if (
            result &&
            typeof result === 'object' &&
            typeof (result as unknown as { then?: unknown }).then === 'function'
        ) {
            setIsRunning(true)
            ;(result as Promise<unknown>)
                .then(() => close())
                .catch(() => {})
                .finally(() => setIsRunning(false))
            return
        }
        close()
    }

    return (
        <DialogContent
            className="md:max-w-[425px]"
            isFullscreenOnMobile={false}
            closeButton={false}
            isOpen={isOpen}
            onOpenChange={open => {
                if (!open && !isRunning) close()
            }}
        >
            <LoadingOverlay isLoading={isRunning} text={t('common.processing')}>
                <div className="flex flex-col gap-4">
                    <DialogHeader className="flex flex-col items-center justify-center text-center sm:text-center">
                        <div className="mb-2">
                            {variant === 'default' && <InfoIcon className="size-12 text-blue-500" />}
                            {variant === 'warning' && <AlertCircle className="size-12 text-amber-500" />}
                            {variant === 'destructive' && <CircleXIcon className="size-12 text-rose-500" />}
                        </div>
                        <DialogTitle className="text-xl font-bold">{data?.title || 'Confirm'}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground text-center sm:text-center">
                            {data?.description || 'Are you sure you want to confirm?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleAction} variant={variant}>
                            {data?.action?.icon ? (
                                isValidElement(data.action.icon) ? (
                                    data.action.icon
                                ) : (
                                    <ActionIcon className="size-4" />
                                )
                            ) : variant === 'destructive' ? (
                                <Trash2 className="size-4" />
                            ) : (
                                <Check className="size-4" />
                            )}
                            {data?.action?.label || t('common.ok' as any)}
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                            {data?.cancel?.icon ? (
                                isValidElement(data.cancel.icon) ? (
                                    data.cancel.icon
                                ) : (
                                    <CancelIcon className="size-4" />
                                )
                            ) : (
                                <X className="size-4" />
                            )}
                            {data?.cancel?.label || t('common.cancel' as any)}
                        </Button>
                    </DialogFooter>
                </div>
            </LoadingOverlay>
        </DialogContent>
    )
}

export { confirm, ConfirmDialog, close as closeConfirm }
