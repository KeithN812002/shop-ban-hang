import { useCallback, useEffect, useRef, useState } from 'react'

/** Open/close state for dropdowns: closes on outside pointer-down and Escape. */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
    const [open, setOpen] = useState(false)
    const ref = useRef<T>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: PointerEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const toggle = useCallback(() => setOpen(value => !value), [])
    const close = useCallback(() => setOpen(false), [])
    return { open, setOpen, toggle, close, ref }
}
