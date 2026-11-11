import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/form-controls'
import { Modal } from '@/components/ui/modal'

export interface ConfirmOptions {
    title: string
    message?: string
    confirmLabel?: string
    destructive?: boolean
    /** Ask for a free-text reason; confirm stays disabled until it is filled when `required`. */
    reason?: { label: string; required?: boolean }
}

export interface ConfirmResult {
    reason: string
}

interface Pending {
    options: ConfirmOptions
    resolve: (result: ConfirmResult | null) => void
}

/**
 * Promise-style confirmation (destructive actions, cancel-with-reason).
 * `const { ask, dialog } = useConfirm()` -> render `{dialog}` once, `await ask({...})` returns null when dismissed.
 */
export function useConfirm(): { ask: (options: ConfirmOptions) => Promise<ConfirmResult | null>; dialog: ReactNode } {
    const { t } = useTranslation()
    const [pending, setPending] = useState<Pending | null>(null)
    const [reason, setReason] = useState('')
    const settled = useRef(false)

    const ask = useCallback(
        (options: ConfirmOptions) =>
            new Promise<ConfirmResult | null>(resolve => {
                settled.current = false
                setReason('')
                setPending({ options, resolve })
            }),
        [],
    )

    const finish = (result: ConfirmResult | null) => {
        if (!pending || settled.current) return
        settled.current = true
        pending.resolve(result)
        setPending(null)
    }

    const options = pending?.options
    const reasonMissing = Boolean(options?.reason?.required) && reason.trim().length === 0

    const dialog = (
        <Modal
            open={pending !== null}
            onClose={() => finish(null)}
            title={options?.title ?? ''}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={() => finish(null)}>
                        {t('seller.common.dismiss')}
                    </Button>
                    <Button
                        variant={options?.destructive ? 'danger' : 'primary'}
                        disabled={reasonMissing}
                        onClick={() => finish({ reason: reason.trim() })}
                    >
                        {options?.confirmLabel ?? t('seller.common.confirm')}
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                {options?.message && <p className="text-sm text-gray-700">{options.message}</p>}
                {options?.reason && (
                    <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">{options.reason.label}</span>
                        <Textarea rows={3} value={reason} maxLength={500} onChange={event => setReason(event.target.value)} />
                    </label>
                )}
            </div>
        </Modal>
    )

    return { ask, dialog }
}
