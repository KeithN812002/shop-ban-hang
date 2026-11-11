import { useRef, useState, type ReactNode } from 'react'

interface HeaderDropdownProps {
    trigger: ReactNode
    align?: 'left' | 'right'
    menuClassName?: string
    triggerClassName?: string
    children: ReactNode
}

export function HeaderDropdown({
    trigger,
    align = 'left',
    menuClassName = '',
    triggerClassName = '',
    children,
}: HeaderDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const scheduleClose = () => {
        if (timerRef.current) return
        timerRef.current = setTimeout(() => {
            setIsOpen(false)
            timerRef.current = null
        }, 200)
    }

    const cancelClose = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    return (
        <div
            className={`relative inline-flex ${triggerClassName}`}
            onMouseEnter={() => {
                cancelClose()
                setIsOpen(true)
            }}
            onMouseLeave={scheduleClose}
        >
            {trigger}
            {isOpen && (
                <div
                    className={`absolute top-full mt-1 z-50 rounded-lg border bg-popover/80 backdrop-blur-xl text-popover-foreground shadow-popover outline-none ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName}`}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                >
                    {children}
                </div>
            )}
        </div>
    )
}
