import * as React from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { cn } from '@workspace/ui/lib/utils'
import { Popover, PopoverDialog, PopoverTrigger } from '@workspace/ui/components/Popover'
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarTrigger,
    useSidebar,
} from './Sidebar'
import { ChevronRight } from 'lucide-react'

import type { SidebarNavigationMenuItem, SidebarNavigationMenuProps, DashboardHeaderProps } from './Sidebar.types'

function serializeMenuTreeKey(nodes: SidebarNavigationMenuItem[]): string {
    return nodes
        .map(n => {
            const childKey = n.items?.length ? serializeMenuTreeKey(n.items) : ''
            return `${n.menuCode}\u001f${n.url}\u001f${childKey}`
        })
        .join('\u001e')
}

function MenuChevron() {
    return (
        <ChevronRight className="ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-sidebar-foreground" />
    )
}

function MenuIcon({ icon: Icon, title }: { icon?: React.FC; title: string }) {
    if (Icon) return <Icon />
    const initial = title.trim().charAt(0) || '?'
    return (
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[12px] font-semibold uppercase text-muted-foreground">
            {initial}
        </span>
    )
}

function MenuBadge({ count, className }: { count?: number; className?: string }) {
    if (!count || count <= 0) return null
    return (
        <span
            className={cn(
                'ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none group-data-[collapsible=icon]:hidden',
                className || 'bg-destructive text-white',
            )}
        >
            {count > 99 ? '99+' : count}
        </span>
    )
}

function MenuLabel({
    icon,
    title,
    badgeCount,
    badgeClassName,
}: {
    icon?: React.FC
    title: string
    badgeCount?: number
    badgeClassName?: string
}) {
    return (
        <React.Fragment>
            <MenuIcon icon={icon} title={title} />
            <span className="w-0 min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">{title}</span>
            <MenuBadge count={badgeCount} className={badgeClassName} />
        </React.Fragment>
    )
}

function CollapsedMenuContent({
    item,
    isActive,
    renderSubItems,
}: {
    item: SidebarNavigationMenuItem
    isActive?: boolean
    renderSubItems: (items?: SidebarNavigationMenuItem[]) => React.ReactNode
}) {
    return (
        <PopoverTrigger>
            <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                className="transition-all group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border group-data-[collapsible=icon]:bg-sidebar-accent/40 group-data-[collapsible=icon]:data-[active=true]:border-primary/60 group-data-[collapsible=icon]:data-[active=true]:bg-primary/20"
            >
                <MenuLabel
                    icon={item.icon}
                    title={item.title}
                    badgeCount={item.badgeCount}
                    badgeClassName={item.badgeClassName}
                />
            </SidebarMenuButton>
            <Popover placement="right top">
                <PopoverDialog className="min-w-[280px] max-w-[450px] max-h-[calc(100vh-100px)] overflow-y-auto p-2">
                    <div className="flex items-center gap-2.5 px-1 py-1.5 mb-1.5 border-b border-sidebar-border/50 pb-2">
                        <MenuIcon icon={item.icon} title={item.title} />
                        <span className="text-sm font-semibold text-sidebar-foreground truncate">{item.title}</span>
                    </div>
                    <SidebarMenuSub className="space-y-1">{renderSubItems(item.items)}</SidebarMenuSub>
                </PopoverDialog>
            </Popover>
        </PopoverTrigger>
    )
}

function ExpandedMenuContent({
    item,
    isOpen,
    isActive,
    toggleMenu,
    renderSubItems,
    enableAutoScroll,
}: {
    item: SidebarNavigationMenuItem
    isOpen: boolean
    isActive?: boolean
    toggleMenu: (menuCode: string, isOpen: boolean) => void
    renderSubItems: (items?: SidebarNavigationMenuItem[]) => React.ReactNode
    enableAutoScroll?: boolean
}) {
    const itemRef = React.useRef<HTMLLIElement>(null)
    const prevOpenRef = React.useRef(isOpen)

    React.useEffect(() => {
        const wasOpen = prevOpenRef.current
        prevOpenRef.current = isOpen
        // Only scroll on a fresh open (closed -> open) triggered by the user, never on mount or while searching.
        if (!enableAutoScroll || !isOpen || wasOpen) return
        const el = itemRef.current
        if (!el) return
        requestAnimationFrame(() => {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        })
    }, [isOpen, enableAutoScroll])

    return (
        <Collapsible
            asChild
            open={isOpen}
            onOpenChange={open => toggleMenu(item.menuCode, open)}
            className="group/collapsible"
        >
            <SidebarMenuItem ref={itemRef}>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className="transition-all group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border group-data-[collapsible=icon]:bg-sidebar-accent/40 group-data-[collapsible=icon]:data-[active=true]:border-primary/60 group-data-[collapsible=icon]:data-[active=true]:bg-primary/20"
                    >
                        <MenuLabel
                            icon={item.icon}
                            title={item.title}
                            badgeCount={item.badgeCount}
                            badgeClassName={item.badgeClassName}
                        />
                        <MenuChevron />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-0.5 overflow-hidden" data-collapsible-content>
                    <SidebarMenuSub>{renderSubItems(item.items)}</SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

const isActivePath = (pathname: string | undefined, url: string) => {
    if (!pathname || !url || url === '#') return false
    if (pathname === url) return true
    const prefix = url.endsWith('/') ? url : `${url}/`
    return pathname.startsWith(prefix)
}

interface ActiveStateResult {
    activeCodes: Set<string>
    hasActiveChild: boolean
}

const traverseActiveState = (items: SidebarNavigationMenuItem[], pathname: string | undefined): ActiveStateResult => {
    const activeCodes = new Set<string>()
    let hasActiveChild = false

    const dfs = (items: SidebarNavigationMenuItem[]): boolean => {
        for (const item of items) {
            const isActive = isActivePath(pathname, item.url)
            const childActive = item.items?.length ? dfs(item.items) : false

            if (isActive || childActive) {
                activeCodes.add(item.menuCode)
                hasActiveChild = true
                return true
            }
        }
        return false
    }

    dfs(items)
    return { activeCodes, hasActiveChild }
}

const getActiveMenuCodes = (nodes: SidebarNavigationMenuItem[], pathname: string | undefined): Set<string> =>
    traverseActiveState(nodes, pathname).activeCodes

const isChildActive = (nodes: SidebarNavigationMenuItem[], pathname: string | undefined): boolean =>
    traverseActiveState(nodes, pathname).hasActiveChild

function SidebarNavigationMenu({
    items,
    title: _title,
    className,
    linkComponent,
    currentPathname,
    openGroupCode,
    onToggleGroup,
    expandAll,
}: SidebarNavigationMenuProps) {
    const { state, isMobile } = useSidebar()
    const isCollapsed = state === 'collapsed'
    const LinkComponent = linkComponent || 'a'

    // Top-level groups are controlled by the parent (single-open accordion) when onToggleGroup is provided.
    const isGroupControlled = typeof onToggleGroup === 'function'

    const menuStructureKey = serializeMenuTreeKey(items)
    const itemsRef = React.useRef(items)
    itemsRef.current = items

    // Local state now only tracks NESTED sub-menus; start with just the active chain (no expand-all).
    const [openMenus, setOpenMenus] = React.useState<Set<string>>(() => {
        return getActiveMenuCodes(items, currentPathname)
    })

    React.useEffect(() => {
        setOpenMenus(prev => {
            const active = getActiveMenuCodes(itemsRef.current, currentPathname)
            const next = new Set(prev)
            active.forEach(code => next.add(code))
            return next
        })
    }, [currentPathname, menuStructureKey])

    const toggleMenu = React.useCallback((menuCode: string, isOpen: boolean) => {
        setOpenMenus(prev => {
            const next = new Set(prev)
            if (isOpen) {
                next.add(menuCode)
            } else {
                next.delete(menuCode)
            }
            return next
        })
    }, [])

    const renderSubItems = React.useCallback(
        (subItems?: SidebarNavigationMenuItem[]) => {
            if (!subItems) return null

            return subItems.map(subItem => {
                const hasChildren = subItem.items && subItem.items.length > 0
                const isOpen = expandAll || openMenus.has(subItem.menuCode)

                if (!hasChildren) {
                    return (
                        <SidebarMenuSubItem key={subItem.menuCode}>
                            <SidebarMenuSubButton
                                isActive={isActivePath(currentPathname, subItem.url)}
                                asChild
                                tooltip={subItem.title}
                                size="md"
                            >
                                <LinkComponent to={subItem.url}>
                                    <MenuLabel
                                        icon={subItem.icon}
                                        title={subItem.title}
                                        badgeCount={subItem.badgeCount}
                                        badgeClassName={subItem.badgeClassName}
                                    />
                                </LinkComponent>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    )
                }

                return (
                    <SidebarMenuSubItem key={subItem.menuCode}>
                        <Collapsible
                            asChild
                            open={isOpen}
                            onOpenChange={open => toggleMenu(subItem.menuCode, open)}
                            className="group/collapsible"
                        >
                            <div>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton tooltip={subItem.title} size="md">
                                        <MenuLabel
                                            icon={subItem.icon}
                                            title={subItem.title}
                                            badgeCount={subItem.badgeCount}
                                            badgeClassName={subItem.badgeClassName}
                                        />
                                        <MenuChevron />
                                    </SidebarMenuSubButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-0.5 pl-2 overflow-hidden" data-collapsible-content>
                                    <SidebarMenuSub>{renderSubItems(subItem.items)}</SidebarMenuSub>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    </SidebarMenuSubItem>
                )
            })
        },
        [currentPathname, openMenus, toggleMenu, LinkComponent, expandAll],
    )

    return (
        <SidebarGroup
            className={cn('group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:pb-1', className)}
        >
            <SidebarMenu>
                {items.map(item => {
                    const childItems = item.items
                    const hasChildren = !!childItems?.length
                    const isRootActive =
                        hasChildren && childItems
                            ? isChildActive(childItems, currentPathname)
                            : isActivePath(currentPathname, item.url)
                    const isOpen = expandAll
                        ? true
                        : isGroupControlled
                          ? openGroupCode === item.menuCode
                          : openMenus.has(item.menuCode)

                    // No children - simple link
                    if (!hasChildren) {
                        return (
                            <SidebarMenuButton
                                key={item.menuCode}
                                isActive={isRootActive}
                                asChild
                                tooltip={item.title}
                                className="transition-all group-data-[collapsible=icon]:border group-data-[collapsible=icon]:border-sidebar-border group-data-[collapsible=icon]:bg-sidebar-accent/40 group-data-[collapsible=icon]:data-[active=true]:border-primary/60 group-data-[collapsible=icon]:data-[active=true]:bg-primary/20"
                            >
                                <LinkComponent to={item.url}>
                                    <MenuLabel
                                        icon={item.icon}
                                        title={item.title}
                                        badgeCount={item.badgeCount}
                                        badgeClassName={item.badgeClassName}
                                    />
                                </LinkComponent>
                            </SidebarMenuButton>
                        )
                    }

                    // Collapsed popover
                    if (isCollapsed && !isMobile) {
                        return (
                            <SidebarMenuItem key={item.menuCode}>
                                <CollapsedMenuContent
                                    item={item}
                                    isActive={isRootActive}
                                    renderSubItems={renderSubItems}
                                />
                            </SidebarMenuItem>
                        )
                    }

                    // Expanded with collapsible
                    return (
                        <ExpandedMenuContent
                            key={item.menuCode}
                            item={item}
                            isOpen={isOpen}
                            isActive={isRootActive}
                            toggleMenu={isGroupControlled ? menuCode => onToggleGroup!(menuCode) : toggleMenu}
                            renderSubItems={renderSubItems}
                            enableAutoScroll={!expandAll}
                        />
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

function DashboardHeader({ children, title, subtitle, logo, linkComponent, to = '/' }: DashboardHeaderProps) {
    const LinkComp = linkComponent || 'a'

    return (
        <header className="sticky top-0 z-[55] bg-[rgb(12,70,150)] flex h-[var(--navbar-height)] shrink-0 items-center gap-3 border-b w-full px-4 md:px-6">
            <SidebarTrigger className="md:hidden text-white -ml-2" />
            <LinkComp
                to={to}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity no-underline text-inherit"
            >
                {logo && <img src={logo} alt="Logo" className="size-11 shrink-0 object-contain mr-[15px]" />}
                {title && (
                    <div className="flex flex-col justify-center leading-tight">
                        <span className="text-lg font-bold text-white">{title}</span>
                        {subtitle && <span className="text-sm text-white/60">{subtitle}</span>}
                    </div>
                )}
            </LinkComp>
            <div className="ml-auto flex items-center gap-2">{children}</div>
        </header>
    )
}

export { SidebarNavigationMenu, DashboardHeader, isActivePath }
export type { SidebarNavigationMenuItem }
