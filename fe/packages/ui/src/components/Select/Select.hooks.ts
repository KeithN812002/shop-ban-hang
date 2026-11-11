import React from 'react'

const POSITION_THRESHOLD = 0.5

function findPopoverEl(triggerEl: Element): HTMLElement | null {
    const id = triggerEl.getAttribute('aria-controls')
    return id ? (document.getElementById(id)?.parentElement as HTMLElement | null) : null
}

function syncPosition(el: HTMLElement, prop: 'top' | 'bottom' | 'left', value: number) {
    if (Math.abs(parseFloat(el.style[prop]) - value) > POSITION_THRESHOLD) {
        el.style[prop] = `${value}px`
    }
}

export function usePopoverScrollTracking(selectRef: React.RefObject<HTMLDivElement | null>, isOpen: boolean) {
    React.useEffect(() => {
        if (!isOpen) return

        let animFrameId: number
        let triggerEl: Element | null = null
        let popoverEl: HTMLElement | null = null
        let offsetY = 0
        let offsetX = 0
        let usesBottom = false
        let ready = false

        const tick = () => {
            if (!ready) {
                triggerEl = selectRef.current?.querySelector('button') ?? null
                popoverEl = triggerEl ? findPopoverEl(triggerEl) : null

                if (triggerEl && popoverEl) {
                    const r = triggerEl.getBoundingClientRect()
                    const styleLeft = popoverEl.style.left
                    const styleTop = popoverEl.style.top
                    const styleBottom = popoverEl.style.bottom

                    offsetX = (parseFloat(styleLeft) || 0) - r.left

                    if (styleTop) {
                        offsetY = (parseFloat(styleTop) || 0) - r.top
                        usesBottom = false
                        ready = true
                    } else if (styleBottom) {
                        offsetY = (parseFloat(styleBottom) || 0) - (window.innerHeight - r.bottom)
                        usesBottom = true
                        ready = true
                    }
                }
            }

            if (ready && triggerEl && popoverEl) {
                const r = triggerEl.getBoundingClientRect()
                syncPosition(popoverEl, 'left', r.left + offsetX)
                syncPosition(
                    popoverEl,
                    usesBottom ? 'bottom' : 'top',
                    usesBottom ? window.innerHeight - r.bottom + offsetY : r.top + offsetY,
                )
            }

            animFrameId = requestAnimationFrame(tick)
        }

        animFrameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameId)
    }, [selectRef, isOpen])
}
