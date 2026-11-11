import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import {
    Breadcrumbs,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@workspace/ui/components/Breadcrumbs'
import { Button } from '@workspace/ui/components/Button'
import { Menu, MenuSeparator } from '@workspace/ui/components/Menu'
import { MenuItem as AriaMenuItem } from 'react-aria-components'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import {
    DashboardHeader,
    SidebarNavigationMenu,
    SidebarNavigationMenuItem,
    SidebarTrigger,
    useSidebar,
    isActivePath,
} from '@workspace/ui/components/Sidebar'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
} from '@workspace/ui/components/Sidebar'

import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@workspace/ui/components/Sonner'
import { useAuthLogout } from '@/hooks/useAuthLogout'
import { useMenuData } from '@/providers/MenuDataProvider'
import { useMenuPermission } from '@/providers/MenuPermissionProvider'
import { useAuth } from '@/providers/AuthProvider'
import { useMenu } from '@/hooks/useMenu'
import type { MenuTreeNode } from '@/types/menu.types'
import { getMenuDisplayName, normalizeMenuFolder } from '@/utils/menu.utils'
import { useMenuBadges, type MenuBadgeMap } from '@/config/menuBadgeRegistry'
import { Home, User, KeyRound, LogOut, Repeat, PanelLeft } from 'lucide-react'
import { getIconComponent } from '@/utils/menu.utils'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { HeaderDropdown } from '@/shared/components/InlineDropdown'
import { SidebarToggle } from '@/shared/components/SidebarToggle'
import { NoticeScreen } from '@/shared/components/NoticeScreen'
import { useForbiddenStore } from '@/stores/useForbiddenStore'
import { clearListFilterState } from '@/lib/listFilterStateCache'
import { UserDetailsDialog } from '@/shared/components/UserMenu/UserDetailsDialog'
import { ChangePasswordDialog } from '@/shared/components/UserMenu/ChangePasswordDialog'
import { PermissionTypeEnum } from '@/constants/options'
import { stripBasePath } from '@/utils/menu.utils'
import { env } from '@/config/env'
import { Badge } from '@workspace/ui/components/Badge'

function MiniSidebarToggle() {
    const { setOpen, isMobile, openMobile, setOpenMobile, open } = useSidebar()
    const { t } = useTranslation()

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (isMobile) {
            setOpenMobile(!openMobile)
        } else {
            setOpen(true)
        }
    }
    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-label={open ? t('dashboardLayout.sidebar.collapse') : t('dashboardLayout.sidebar.expand')}
            aria-expanded={open}
            className="size-8 flex items-center justify-center rounded-md hover:bg-accent/80 text-sidebar-foreground cursor-pointer z-[100] relative pointer-events-auto transition-all"
        >
            <PanelLeft className="size-5 text-primary" />
        </button>
    )
}

interface DashboardLayoutProps {
    children: React.ReactNode
    defaultOpen?: boolean
}

const MenuItem = ({ children, className, ...props }: React.ComponentProps<typeof AriaMenuItem>) => (
    <AriaMenuItem
        className={`relative flex cursor-default select-none items-center gap-2.5 rounded-sm py-1.5 px-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[focused]:bg-primary data-[focused]:text-white ${className || ''}`}
        {...props}
    >
        {children}
    </AriaMenuItem>
)

const convertMenuToSidebarItem = (
    menuNode: MenuTreeNode,
    canViewMenu: (menuCode: string) => boolean,
    language: string,
    menuBadges: MenuBadgeMap,
): SidebarNavigationMenuItem | null => {
    if (!canViewMenu(menuNode.MenuCode)) {
        return null
    }

    // Hide Page-type items from sidebar (should only be accessed via buttons/navigation)
    if (menuNode.ModuleType === PermissionTypeEnum.PAGE) {
        return null
    }

    const children = menuNode.children
        .map(child => convertMenuToSidebarItem(child, canViewMenu, language, menuBadges))
        .filter((item): item is SidebarNavigationMenuItem => item !== null)

    if (
        (menuNode.ModuleType === PermissionTypeEnum.GROUP || menuNode.ModuleType === PermissionTypeEnum.MODULE) &&
        children.length === 0
    ) {
        return null
    }

    const icon = getIconComponent(menuNode.Icon)
    const badge = menuBadges[normalizeMenuFolder(menuNode.PathFolder)]

    let url = menuNode.Url

    // Groups and Modules should not have a direct URL for navigation in the sidebar
    if (menuNode.ModuleType === PermissionTypeEnum.GROUP || menuNode.ModuleType === PermissionTypeEnum.MODULE) {
        url = '#'
    }

    if (!url || url === '#') {
        if (
            (menuNode.ModuleType === PermissionTypeEnum.GROUP || menuNode.ModuleType === PermissionTypeEnum.MODULE) &&
            children.length > 0
        ) {
            const firstChildWithUrl = children.find(child => child.url && child.url !== '#')
            if (firstChildWithUrl) {
                url = firstChildWithUrl.url
            }
        }
        if (!url || url === '#') {
            url = '#'
        }
    }

    return {
        menuCode: menuNode.MenuCode,
        title: getMenuDisplayName(menuNode, language),
        url,
        icon,
        items: children.length > 0 ? children : undefined,
        badgeCount: badge?.count,
        badgeClassName: badge?.className,
    }
}

const groupMenusByApp = (
    menuTree: MenuTreeNode[],
    canViewMenu: (menuCode: string) => boolean,
    language: string,
    menuBadges: MenuBadgeMap,
): Array<{ appCode: string; appName: string; items: SidebarNavigationMenuItem[] }> => {
    const grouped = new Map<
        string,
        { appCode: string; appName: string; menuCode: string; items: SidebarNavigationMenuItem[] }
    >()

    menuTree.forEach(node => {
        const appKey = node.AppCode ?? node.ModuleCode ?? ''
        if (!grouped.has(appKey)) {
            grouped.set(appKey, {
                appCode: appKey,
                appName: getMenuDisplayName(node, language),
                items: [],
                menuCode: node.MenuCode,
            })
        }

        const converted = convertMenuToSidebarItem(node, canViewMenu, language, menuBadges)
        if (converted) {
            grouped.get(appKey)!.items.push(converted)
        }
    })

    return Array.from(grouped.values()).filter(group => group.items.length > 0)
}

function SidebarMenuLink({ to, onClick, ...props }: React.ComponentProps<typeof Link>) {
    const navigate = useNavigate()

    return (
        <Link
            to={to}
            onClick={event => {
                onClick?.(event)
                if (event.defaultPrevented) {
                    return
                }

                event.preventDefault()
                // Entering a screen from the menu means a clean grid: drop the remembered page/filters.
                clearListFilterState()
                navigate({ to })
            }}
            {...props}
        />
    )
}

function groupContainsActivePath(item: SidebarNavigationMenuItem, pathname: string): boolean {
    if (isActivePath(pathname, item.url)) return true
    return item.items?.some(child => groupContainsActivePath(child, pathname)) ?? false
}

// Recursive search filter: if a node's own title matches, keep its whole subtree;
// otherwise keep it only when some descendant matches, pruning non-matching branches.
function filterMenuItems(items: SidebarNavigationMenuItem[], keyword: string): SidebarNavigationMenuItem[] {
    const result: SidebarNavigationMenuItem[] = []
    for (const item of items) {
        if (item.title?.toLowerCase().includes(keyword)) {
            result.push(item)
            continue
        }
        const matchedChildren = item.items?.length ? filterMenuItems(item.items, keyword) : []
        if (matchedChildren.length > 0) {
            result.push({ ...item, items: matchedChildren })
        }
    }
    return result
}

interface SidebarNavProps {
    filteredAppGroups: Array<{
        appCode: string
        appName: string
        items: SidebarNavigationMenuItem[]
    }>
    searchKeyword: string
    setSearchKeyword: (value: string) => void
    currentPathname: string
    linkComponent: React.ElementType
    openGroupCode: string | null
    onToggleGroup: (menuCode: string) => void
}

function SidebarNav({
    filteredAppGroups,
    searchKeyword,
    setSearchKeyword,
    currentPathname,
    linkComponent,
    openGroupCode,
    onToggleGroup,
}: SidebarNavProps) {
    const { t } = useTranslation()
    const isSearching = searchKeyword.trim().length > 0

    return (
        <>
            <div className="flex-none px-4 pt-4 group-data-[collapsible=icon]:hidden pr-6">
                <BsSearchField aria-label={t('common.search')} value={searchKeyword} onChange={setSearchKeyword} />
            </div>
            <SidebarContent className="pt-2 group-data-[collapsible=icon]:pt-0">
                {filteredAppGroups.map(group => (
                    <SidebarNavigationMenu
                        key={group.appCode}
                        title={group.appName}
                        linkComponent={linkComponent}
                        items={group.items}
                        currentPathname={currentPathname}
                        openGroupCode={openGroupCode}
                        onToggleGroup={onToggleGroup}
                        expandAll={isSearching}
                    />
                ))}
            </SidebarContent>
        </>
    )
}
function resolveDynamicUrl(pattern: string | null, currentPath: string): string {
    if (!pattern || pattern === '#') return '#'
    if (pattern.startsWith('http://') || pattern.startsWith('https://')) return pattern

    const cleanPattern = stripBasePath(pattern)
    const cleanCurrentPath = stripBasePath(currentPath)

    const patternParts = cleanPattern.split('/').filter(Boolean)
    const currentParts = cleanCurrentPath.split('/').filter(Boolean)

    const resolvedParts = patternParts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            return currentParts[i] || part
        }
        return part
    })

    const resolvedPath = '/' + resolvedParts.join('/')
    const base = import.meta.env.FIS_PUBLIC_URL || '/'
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base

    return normalizedBase + resolvedPath
}

function getBreadcrumbSearch(currentSearch: Record<string, any>) {
    const { historyId: _historyId, ...forwarded } = currentSearch || {}
    return Object.keys(forwarded).length > 0 ? forwarded : undefined
}

export function DashboardLayout({ children, defaultOpen = true }: DashboardLayoutProps) {
    const currentPathname = useRouterState().location.pathname
    const currentSearch = useRouterState().location.search as Record<string, any>
    const navigate = useNavigate()
    const forbidden = useForbiddenStore()

    useEffect(() => {
        useForbiddenStore.getState().clear()
    }, [currentPathname])
    const { t, i18n } = useTranslation()
    const { user } = useAuth()
    const { logout, isLoading: isLoggingOut } = useAuthLogout({
        onSuccess: () => {
            toast.success({ title: t('dashboardLayout.logoutSuccess') })
        },
    })
    const { menuData } = useMenuData()
    const { canViewMenu } = useMenuPermission()
    const { menuTree, breadcrumbs: defaultBreadcrumbs } = useMenu(menuData, currentPathname)
    const breadcrumbs = useMemo(
        () => defaultBreadcrumbs.filter(crumb => crumb.ModuleType !== PermissionTypeEnum.MODULE),
        [defaultBreadcrumbs],
    )
    const userDisplayName = String(user?.name ?? user?.preferredUsername ?? user?.email ?? 'User')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
    // Get current module from URL, skipping base path (e.g., /base/sa/config/system -> sa)
    const relativePath = stripBasePath(currentPathname)
    const currentModule = relativePath.split('/')[1] || 'sa'

    // Filter menu tree to only show items from current module (case-insensitive)
    const filteredMenuTree = useMemo(() => {
        const moduleLower = currentModule.toLowerCase()
        return menuTree.filter(node => {
            const appCode = node.AppCode?.toLowerCase()
            const moduleCode = node.ModuleCode?.toLowerCase()
            return appCode === moduleLower || moduleCode === moduleLower
        })
    }, [menuTree, currentModule])

    const menuBadges = useMenuBadges(filteredMenuTree)

    // Convert menu tree to sidebar items grouped by app
    const appGroups = useMemo(() => {
        return groupMenusByApp(filteredMenuTree, canViewMenu, i18n.language, menuBadges)
    }, [filteredMenuTree, canViewMenu, i18n.language, menuBadges])

    // Filter app groups by search keyword (recursively prunes to matching items)
    const filteredAppGroups = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase()
        if (!keyword) return appGroups

        return appGroups
            .map(group => ({ ...group, items: filterMenuItems(group.items, keyword) }))
            .filter(group => group.items.length > 0)
    }, [appGroups, searchKeyword])

    // Single-open accordion: exactly one top-level group open across the whole sidebar.
    // Derived from the unfiltered appGroups so search keystrokes don't churn the open group.
    const activeGroupCode = useMemo(() => {
        for (const group of appGroups) {
            for (const item of group.items) {
                if (item.items?.length && groupContainsActivePath(item, currentPathname)) {
                    return item.menuCode
                }
            }
        }
        return null
    }, [appGroups, currentPathname])

    const firstGroupCode = useMemo(() => {
        for (const group of appGroups) {
            const first = group.items.find(item => item.items?.length)
            if (first) return first.menuCode
        }
        return null
    }, [appGroups])

    const [openGroupCode, setOpenGroupCode] = useState<string | null>(null)

    // On entry / navigation: open the group holding the active route, else fall back to the first group.
    useEffect(() => {
        setOpenGroupCode(activeGroupCode ?? firstGroupCode)
    }, [activeGroupCode, firstGroupCode])

    const handleToggleGroup = useCallback((menuCode: string) => {
        setOpenGroupCode(prev => (prev === menuCode ? null : menuCode))
    }, [])

    const currentModuleDisplayName = useMemo(() => {
        const moduleLower = currentModule.toLowerCase()

        // 1. Try finding a root module/app in user.permissions first
        const rootPermission = user?.permissions?.find(p => {
            const isModule = p.type === PermissionTypeEnum.MODULE || p.parentCode === null || !p.parentCode
            const codeLower = p.code?.toLowerCase()
            const urlLower = p.url?.replace(/^\//, '')?.toLowerCase()
            return isModule && (codeLower === moduleLower || urlLower === moduleLower)
        })
        if (rootPermission) {
            return i18n.language === 'en' && rootPermission.foreignName
                ? rootPermission.foreignName
                : rootPermission.name
        }

        // 2. Try finding a root node in menuTree matching currentModule (case-insensitive)
        const node = menuTree.find(n => {
            const appCode = n.AppCode?.toLowerCase()
            const moduleCode = n.ModuleCode?.toLowerCase()
            return appCode === moduleLower || moduleCode === moduleLower
        })
        if (node) {
            return getMenuDisplayName(node, i18n.language)
        }

        // 3. Fallback to translation file
        const fallbackKey = `dynamicRoute.modulePage.items.${currentModule}`
        const translation = t(fallbackKey as any)

        // If translation returned the key itself (meaning translation is missing), return formatted currentModule as last resort
        if (translation === fallbackKey) {
            return currentModule
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }
        return translation
    }, [menuTree, currentModule, i18n.language, user?.permissions, t])

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <DashboardHeader
                title={t('dashboardLayout.header.title')}
                subtitle={
                    <span className="flex items-center gap-1.5">
                        <span>{t('dashboardLayout.header.subtitle')}</span>
                        <span className="text-white/40 font-light">|</span>
                        <span className="text-amber-300 font-semibold uppercase text-[11px] tracking-wider bg-white/10 px-2 py-0.5 rounded">
                            {currentModuleDisplayName}
                        </span>
                    </span>
                }
                logo="/images/logo.svg"
                linkComponent={Link}
                to="/modules"
            >
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    {/* User Menu — hover-to-open */}
                    <HeaderDropdown
                        align="right"
                        trigger={
                            <Button
                                variant="ghost"
                                aria-label={t('dashboardLayout.userMenu.ariaLabel')}
                                className="h-10 px-1 md:px-3 cursor-default rounded-md border border-transparent hover:bg-white/10 focus-visible:outline-none focus-visible:ring-0"
                            >
                                <div className="flex items-center gap-2 text-white">
                                    <Avatar className="size-7">
                                        <AvatarFallback className="bg-white/20 text-white">
                                            {userDisplayName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline-block text-sm font-medium text-white">
                                        {t('dashboardLayout.userMenu.greetingPrefix')}{' '}
                                        <span className="font-semibold">{userDisplayName}</span>
                                    </span>
                                </div>
                            </Button>
                        }
                        menuClassName="min-w-[250px]"
                    >
                        <Menu aria-label={t('dashboardLayout.userMenu.ariaLabel')}>
                            <MenuItem isDisabled className="py-2 data-[disabled]:opacity-100">
                                <span className="flex w-full items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-foreground">
                                        {user?.preferredUsername != null && user.preferredUsername !== ''
                                            ? String(user.preferredUsername)
                                            : userDisplayName}
                                    </span>
                                    <Badge
                                        variant={user?.isInternal !== false ? 'default' : 'secondary'}
                                        className="h-5 shrink-0 px-1.5 text-[10px] font-medium"
                                    >
                                        {user?.isInternal !== false
                                            ? t('dashboardLayout.userMenu.userDetailsDialog.internal')
                                            : t('dashboardLayout.userMenu.userDetailsDialog.external')}
                                    </Badge>
                                </span>
                            </MenuItem>
                            <MenuSeparator className="bg-border" />
                            <MenuItem onAction={() => setIsUserDetailsOpen(true)}>
                                <User className="size-4" />
                                {t('dashboardLayout.userMenu.accountDetails')}
                            </MenuItem>
                            {/* Only external accounts (isInternal = false) may change their password. */}
                            {!user?.isInternal && (
                                <MenuItem onAction={() => setIsChangePasswordOpen(true)}>
                                    <KeyRound className="size-4" />
                                    {t('dashboardLayout.userMenu.changePassword')}
                                </MenuItem>
                            )}
                            <MenuItem onAction={() => navigate({ to: '/modules', hash: 'switch' })}>
                                <Repeat className="size-4" />
                                {t('dashboardLayout.userMenu.switchModule')}
                            </MenuItem>
                            <MenuItem
                                onAction={() => logout()}
                                className="rounded-md text-destructive data-[focused]:!bg-destructive/10 data-[focused]:!text-destructive"
                                isDisabled={isLoggingOut}
                            >
                                <LogOut className="size-4" />
                                {isLoggingOut ? t('common.logoutLoading') : t('common.logout')}
                            </MenuItem>
                            <MenuSeparator className="bg-border" />
                            <MenuItem
                                isDisabled
                                className="items-center justify-center py-2 text-[11px] leading-tight text-muted-foreground/70 data-[disabled]:opacity-100"
                            >
                                <span>
                                    <span className="uppercase">{env.envLabel}</span>
                                    {' · build '}
                                    <span className="font-mono">{env.gitCommit}</span>
                                </span>
                            </MenuItem>
                        </Menu>
                    </HeaderDropdown>
                </div>
            </DashboardHeader>

            <UserDetailsDialog isOpen={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen} user={user} />
            <ChangePasswordDialog isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />

            <div className="flex flex-1 w-full min-h-0">
                <Sidebar collapsible="icon">
                    <SidebarHeader className="hidden md:flex md:group-data-[state=expanded]:hidden items-center justify-center p-0 h-[64px]">
                        <MiniSidebarToggle />
                    </SidebarHeader>
                    <SidebarNav
                        filteredAppGroups={filteredAppGroups}
                        searchKeyword={searchKeyword}
                        setSearchKeyword={setSearchKeyword}
                        currentPathname={currentPathname}
                        linkComponent={SidebarMenuLink}
                        openGroupCode={openGroupCode}
                        onToggleGroup={handleToggleGroup}
                    />
                </Sidebar>

                <SidebarToggle />

                <SidebarInset>
                    <div className="p-6 flex-1 flex flex-col overflow-hidden">
                        {/* Breadcrumb Navigation */}
                        {breadcrumbs.length > 0 && (
                            <Breadcrumbs className="mb-3">
                                <BreadcrumbItem>
                                    <Link
                                        to={`/${currentModule}` as any}
                                        className="transition-colors hover:text-foreground"
                                    >
                                        <Home className="size-4 text-primary" />
                                    </Link>
                                    <BreadcrumbSeparator />
                                </BreadcrumbItem>
                                {breadcrumbs.map((item, index) => {
                                    const isLastItem = index === breadcrumbs.length - 1
                                    const resolvedUrl = resolveDynamicUrl(item.Url, currentPathname)
                                    const isValidPageUrl = item.Url && item.Url !== '#' && item.Url.startsWith('/')
                                    const breadcrumbSearch = getBreadcrumbSearch(currentSearch)
                                    const displayUrl = resolvedUrl || currentPathname

                                    return (
                                        <BreadcrumbItem key={`${item.MenuCode}-${index}`}>
                                            {isLastItem ? (
                                                <BreadcrumbPage>
                                                    {getMenuDisplayName(item, i18n.language, displayUrl)}
                                                </BreadcrumbPage>
                                            ) : isValidPageUrl ? (
                                                <>
                                                    <Link
                                                        to={resolvedUrl || '#'}
                                                        search={breadcrumbSearch}
                                                        className="transition-colors hover:text-foreground"
                                                    >
                                                        {getMenuDisplayName(item, i18n.language, displayUrl)}
                                                    </Link>
                                                    <BreadcrumbSeparator />
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        {getMenuDisplayName(item, i18n.language, displayUrl)}
                                                    </span>
                                                    <BreadcrumbSeparator />
                                                </>
                                            )}
                                        </BreadcrumbItem>
                                    )
                                })}
                            </Breadcrumbs>
                        )}
                        {forbidden.active ? (
                            <NoticeScreen description={forbidden.message} traceId={forbidden.traceId} />
                        ) : (
                            children
                        )}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
