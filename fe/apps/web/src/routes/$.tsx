import { createFileRoute, useLocation, useNavigate, Link } from '@tanstack/react-router'
import { lazy, Suspense, ComponentType, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@workspace/ui/components/PageContainer'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { FileX } from 'lucide-react'
import { useMenuPermission } from '@/providers/MenuPermissionProvider'
import type { MenuItem } from '@/types/menu.types'
import { getMenuDisplayName, getIconComponent, stripBasePath } from '@/utils/menu.utils'
import { DashboardLayout } from '@/shared/layouts/DashboardLayout'
import { useAuth } from '@/providers/AuthProvider'
import { useMenuData } from '@/providers/MenuDataProvider'
import { PermissionTypeEnum } from '@/constants/options'
import { ActiveMenuProvider } from '@/providers/ActiveMenuProvider'
import { getModuleDashboard } from '@/config/moduleRegistry'

const pageModules = import.meta.glob<{ default: ComponentType<{ menuItem: MenuItem }> }>('../pages/**/*.tsx', {
    eager: false,
})

export const Route = createFileRoute('/$')({
    component: () => (
        <DashboardLayout>
            <DynamicPage />
        </DashboardLayout>
    ),
})

const resolveComponentPath = (pathFolder?: string | null) => {
    if (!pathFolder) return null
    const normalized = pathFolder.replace(/^\.\//, '').replace(/^\//, '')
    if (!normalized) return null
    return `../pages/${normalized}`
}

const resolveModuleLoader = (componentPath: string | null) => {
    if (!componentPath) return null
    return pageModules[`${componentPath}.tsx`] ?? pageModules[`${componentPath}/index.tsx`] ?? null
}

function DynamicPage() {
    const { t, i18n } = useTranslation()
    const location = useLocation()
    const { findMenuByUrl, canAccessRoute } = useMenuPermission()

    const fullPath = location.pathname

    const menuItem = useMemo(() => findMenuByUrl(fullPath), [findMenuByUrl, fullPath])

    const moduleDashboard = useMemo(() => getModuleDashboard(fullPath), [fullPath])

    // Update document title based on current page
    useEffect(() => {
        const appTitle = t('dynamicRoute.appTitle')
        const pageTitle = menuItem
            ? getMenuDisplayName(menuItem, i18n.language, fullPath)
            : (moduleDashboard?.fallbackTitle ?? '')
        document.title = pageTitle ? `${pageTitle} - ${appTitle}` : appTitle
    }, [menuItem, t, i18n.language, fullPath, moduleDashboard])

    const componentPath = useMemo(() => resolveComponentPath(menuItem?.PathFolder), [menuItem?.PathFolder])

    const moduleLoader = resolveModuleLoader(componentPath)

    const DynamicComponent = useMemo(() => {
        if (!moduleLoader) {
            return null
        }

        return lazy(() =>
            moduleLoader().then(mod => ({
                default: mod.default,
            })),
        )
    }, [moduleLoader])

    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    if (moduleDashboard) {
        if (!canAccessRoute(fullPath)) {
            return <AccessDeniedPage />
        }
        const DashboardComponent = moduleDashboard.component
        return (
            <ActiveMenuProvider activeMenu={menuItem}>
                <Suspense fallback={null}>
                    <DashboardComponent menuItem={menuItem ?? undefined} />
                </Suspense>
            </ActiveMenuProvider>
        )
    }

    // If menu not found, still show DashboardLayout but with default content
    if (!menuItem) {
        // If authenticated and at root or no module context, redirect to module selection
        if (isAuthenticated && stripBasePath(fullPath).replace(/\/$/, '') === '') {
            navigate({ to: '/modules', replace: true })
            return null
        }
        return <WelcomePage />
    }

    if (!canAccessRoute(fullPath)) {
        return <AccessDeniedPage />
    }

    if (!DynamicComponent) {
        if (menuItem.ModuleType === PermissionTypeEnum.GROUP || menuItem.ModuleType === PermissionTypeEnum.MODULE) {
            return (
                <ActiveMenuProvider activeMenu={menuItem}>
                    <CategoryPage menuItem={menuItem} />
                </ActiveMenuProvider>
            )
        }
        return (
            <ActiveMenuProvider activeMenu={menuItem}>
                <DefaultPage menuItem={menuItem} />
            </ActiveMenuProvider>
        )
    }

    return (
        <ActiveMenuProvider activeMenu={menuItem}>
            <Suspense fallback={null}>
                <DynamicComponent key={fullPath} menuItem={menuItem} />
            </Suspense>
        </ActiveMenuProvider>
    )
}

function AccessDeniedPage() {
    const { t } = useTranslation()

    return (
        <EmptyState
            kind="blocked"
            tone="destructive"
            title={t('dynamicRoute.accessDenied.title')}
            description={t('dynamicRoute.accessDenied.description')}
            className="min-h-screen"
        />
    )
}

function WelcomePage() {
    const { t } = useTranslation()

    return (
        <div className="flex-1 flex flex-col justify-center min-h-0 mt-6 px-2 sm:px-4 w-full max-w-6xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight w-full">
                {t('dynamicRoute.welcome.title')}
            </h1>
            <p className="mt-3 text-lg sm:text-xl md:text-2xl font-semibold text-primary w-full">
                {t('dynamicRoute.welcome.subtitle')}
            </p>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed w-full whitespace-nowrap overflow-hidden text-ellipsis">
                {t('dynamicRoute.welcome.description1')}
            </p>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed w-full">
                {t('dynamicRoute.welcome.description2')}
            </p>
        </div>
    )
}

function CategoryPage({ menuItem }: { menuItem: MenuItem }) {
    const { t, i18n } = useTranslation()
    const { menuData } = useMenuData()
    const { canViewMenu } = useMenuPermission()
    const navigate = useNavigate()

    const children = useMemo(() => {
        return menuData
            .filter(m => m.ParentCode === menuItem.MenuCode && m.Status === 'A')
            .filter(m => canViewMenu(m.MenuCode))
            .sort((a, b) => Number(a.OrderNo) - Number(b.OrderNo))
    }, [menuData, menuItem.MenuCode, canViewMenu])

    const groupTitle = getMenuDisplayName(menuItem, i18n.language)

    return (
        <PageContainer title={groupTitle}>
            <div className="flex flex-wrap justify-start gap-4 mt-2 w-full pb-8">
                {children.map(child => {
                    const Icon = getIconComponent(child.Icon)
                    const title = getMenuDisplayName(child, i18n.language)
                    return (
                        <Link
                            key={child.MenuCode}
                            to={child.Url && child.Url !== '#' ? child.Url : '#'}
                            disabled={!child.Url || child.Url === '#'}
                            className="flex items-center gap-4 p-5 bg-card hover:bg-primary/5 border border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all group shadow-sm hover:shadow-md no-underline text-inherit w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] xl:w-[calc(25%-12px)]"
                        >
                            <div className="size-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                {Icon ? (
                                    <Icon className="size-6" />
                                ) : (
                                    <span className="text-xl font-bold">{title.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors whitespace-normal break-words">
                                    {title}
                                </h3>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </PageContainer>
    )
}

function DefaultPage({ menuItem }: { menuItem: MenuItem }) {
    const { t, i18n } = useTranslation()
    const menuTitle = getMenuDisplayName(menuItem, i18n.language)
    return (
        <PageContainer title={menuTitle}>
            <div className="flex-1 flex min-h-0 h-[calc(100vh-200px)]">
                <EmptyState
                    kind="blocked"
                    icon={FileX}
                    title={t('dynamicRoute.defaultPage.noComponentTitle', {
                        menuName: menuTitle,
                    })}
                    description={t('dynamicRoute.defaultPage.contactAdmin')}
                    className="flex-1"
                />
            </div>
        </PageContainer>
    )
}
