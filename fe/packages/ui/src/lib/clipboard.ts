/**
 * Copy text to clipboard, works on non-secure contexts (HTTP) too.
 * Uses `navigator.clipboard` on HTTPS/localhost, falls back to `execCommand` on HTTP.
 *
 * @param anchor Element that triggered the copy; used to locate its dialog so the
 *   focus trap doesn't steal focus from the temp textarea. Defaults to `document.body`.
 * @returns `true` on success.
 */
export async function copyTextToClipboard(text: string, anchor?: HTMLElement | null): Promise<boolean> {
    if (!text) return false

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch {
            // fall through to legacy copy
        }
    }

    return legacyCopy(text, anchor)
}

function legacyCopy(text: string, anchor?: HTMLElement | null): boolean {
    if (typeof document === 'undefined') return false

    const previouslyFocused = document.activeElement as HTMLElement | null
    const host = (anchor?.closest('[role="dialog"]') as HTMLElement | null) ?? document.body

    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.top = '0'
    el.style.left = '0'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    host.appendChild(el)

    try {
        el.focus()
        el.select()
        el.setSelectionRange(0, el.value.length)
        return document.execCommand('copy')
    } catch {
        return false
    } finally {
        host.removeChild(el)
        previouslyFocused?.focus?.()
    }
}
