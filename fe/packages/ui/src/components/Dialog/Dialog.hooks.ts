import React from 'react'

export function usePreventBodyScroll(isOpen?: boolean) {
    React.useEffect(() => {
        if (!isOpen) return

        const scrollContainer =
            document.querySelector<HTMLElement>('[data-slot="sidebar-inset"] > div') ?? document.body

        const originalOverflow = scrollContainer.style.overflow
        scrollContainer.style.overflow = 'hidden'

        return () => {
            scrollContainer.style.overflow = originalOverflow
        }
    }, [isOpen])
}
