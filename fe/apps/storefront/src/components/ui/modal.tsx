import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
    footer?: ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

/** Native <dialog>: focus trap, Esc to close and backdrop come from the browser. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
    const { t } = useTranslation()
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (!dialog) return
        if (open && !dialog.open) dialog.showModal()
        if (!open && dialog.open) dialog.close()
    }, [open])

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            onClick={event => {
                if (event.target === ref.current) onClose()
            }}
            aria-label={title}
            className={cn(
                'm-auto w-[calc(100%-1.5rem)] rounded-xl bg-white p-0 shadow-2xl backdrop:backdrop-blur-[1px]',
                sizes[size],
            )}
        >
            {open && (
                <div className="flex max-h-[85vh] flex-col animate-fade-in">
                    <header className="flex items-center justify-between border-b px-5 py-3">
                        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t('common.close')}
                            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                        >
                            <X className="size-5" />
                        </button>
                    </header>
                    <div className="overflow-y-auto px-5 py-4">{children}</div>
                    {footer && <footer className="flex justify-end gap-2 border-t px-5 py-3">{footer}</footer>}
                </div>
            )}
        </dialog>
    )
}
