import type React from 'react'

export interface SidebarContextProps {
    state: 'expanded' | 'collapsed'
    open: boolean
    setOpen: (open: boolean) => void
    openMobile: boolean
    setOpenMobile: (open: boolean) => void
    isMobile: boolean
    toggleSidebar: () => void
}

export interface SidebarNavigationMenuItem {
    title: string
    url: string
    icon?: React.FC
    isActive?: boolean
    items?: SidebarNavigationMenuItem[]
    menuCode: string
    /** Số hiển thị trên badge cạnh tên menu. 0/undefined = không hiển thị. */
    badgeCount?: number
    /** Class màu cho badge (do phía app quyết định theo nghiệp vụ). */
    badgeClassName?: string
}

export interface SidebarNavigationMenuProps {
    items: Array<SidebarNavigationMenuItem>
    title?: string
    linkComponent?: React.ElementType
    className?: string
    currentPathname?: string
    /** Controlled single-open accordion: menuCode of the top-level group currently open (null = none). */
    openGroupCode?: string | null
    /** Toggle handler for a top-level group. When provided, top-level groups become controlled (single-open). */
    onToggleGroup?: (menuCode: string) => void
    /** When true, expand every group regardless of single-open state (used while searching). */
    expandAll?: boolean
}

export interface DashboardHeaderProps {
    children?: React.ReactNode
    title?: React.ReactNode
    subtitle?: React.ReactNode
    logo?: string
    linkComponent?: React.ElementType
    to?: string
}
