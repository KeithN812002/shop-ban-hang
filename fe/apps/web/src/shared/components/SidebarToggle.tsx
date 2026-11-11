'use client'

import { ChevronRight } from 'lucide-react'
import { useSidebar } from '@workspace/ui/components/Sidebar'

const SIDEBAR_WIDTH = 280
const SIDEBAR_ICON_WIDTH = 64

export function SidebarToggle() {
    const { state, toggleSidebar, isMobile } = useSidebar()
    const isCollapsed = state === 'collapsed'

    if (isCollapsed || isMobile) return null

    return (
        <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            className="fixed z-[60] flex size-8 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border hover:bg-accent transition-all"
            style={{
                left: isCollapsed ? SIDEBAR_ICON_WIDTH : SIDEBAR_WIDTH,
                top: 'calc(var(--navbar-height) + 16px)',
                transform: 'translate(-50%, 0)',
            }}
        >
            <ChevronRight
                className={`size-4 text-primary transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
            />
        </button>
    )
}
