const FOCUSABLE_SELECTOR = [
    'input:not([type="hidden"]):not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ')

const resolveSearchRoot = (): ParentNode => {
    const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
    return dialogs.length > 0 ? dialogs[dialogs.length - 1] : document
}

export const focusFirstInvalidField = () => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const marker = resolveSearchRoot().querySelector<HTMLElement>('[data-invalid]')
            if (!marker) {
                return
            }

            marker.scrollIntoView({ behavior: 'smooth', block: 'center' })

            const field = marker.parentElement ?? marker
            field.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus({ preventScroll: true })
        })
    })
}
