import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Spinner } from '@workspace/ui/components/Spinner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/providers/AuthProvider'
import { useAuthLogout } from '@/hooks/useAuthLogout'
import { keycloakHelpers } from '@/lib/keycloak'
import { clearAuthData } from '@/lib/storage'
import { isAxiosError } from 'axios'
import { LogOut, ShieldAlert, LogIn, RotateCcw } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { ModuleCardPattern } from '@/components/Common/ModuleCardPattern'
import { useMemo, useEffect } from 'react'
import { PermissionTypeEnum } from '@/constants/options'

export const Route = createFileRoute('/modules')({
    component: ModuleSelectionPage,
})

function ModuleSelectionPage() {
    const navigate = useNavigate()
    const isSwitching = useLocation({ select: location => location.hash === 'switch' })
    const { t, i18n } = useTranslation()
    const { user, isLoading: isAuthLoading, userInfoError, setAuthState } = useAuth()
    const { logout, isLoading: isLoggingOut } = useAuthLogout()

    const isLoading = isAuthLoading || isLoggingOut

    const handleBackToLogin = () => {
        clearAuthData()
        setAuthState({ token: null, refreshToken: null, isAuthenticated: false })
        keycloakHelpers.login({ prompt: 'login' })
    }

    const candidateDisplayNames = [user?.name, user?.preferredUsername, user?.email]
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(Boolean)

    const userDisplayName = candidateDisplayNames[0] || t('common.user')

    const isEn = i18n.language === 'en'

    const availableModules = useMemo(() => {
        if (!user?.permissions) return []

        const rootPermissions = user.permissions.filter(
            p => p.type === PermissionTypeEnum.MODULE || p.parentCode === null,
        )

        const sortedRootPermissions = [...rootPermissions].sort((a, b) => {
            const orderA = a.sortOrder !== null && a.sortOrder !== undefined ? a.sortOrder : Infinity
            const orderB = b.sortOrder !== null && b.sortOrder !== undefined ? b.sortOrder : Infinity
            return orderA - orderB
        })

        return sortedRootPermissions.map(p => {
            const colorKey = p.url?.replace(/^\//, '') || 'default'
            return {
                id: p.code,
                colorKey,
                name: isEn && p.foreignName ? p.foreignName : p.name,
                route: p.url || '',
                icon: p.icon || 'Settings',
            }
        })
    }, [user?.permissions, isEn])

    const meErrorStatus = isAxiosError(userInfoError) ? userInfoError.response?.status : undefined
    const hasSystemError =
        !isAuthLoading && !user && !!userInfoError && (meErrorStatus === undefined || meErrorStatus >= 500)
    const hasNoAccess = !isAuthLoading && !hasSystemError && availableModules.length === 0

    const containerConfig = 'flex flex-wrap justify-center gap-6 w-full'

    useEffect(() => {
        if (!isLoading && !isSwitching && availableModules.length === 1) {
            const module = availableModules[0]
            navigate({
                to: '/$',
                params: { _splat: module.route.replace(/^\//, '') },
                replace: true,
            })
        }
    }, [availableModules, isLoading, isSwitching, navigate])

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Spinner className="size-12" />
                <p className="text-sm font-semibold text-primary animate-pulse tracking-wide italic">
                    {isLoggingOut ? t('common.logoutLoading') : t('common.loading')}
                </p>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center px-4 pt-16 pb-8">
            <div className="relative w-full max-w-5xl flex-1 flex flex-col gap-4">
                {!hasNoAccess && !hasSystemError && (
                    <header className="flex flex-col items-center gap-1">
                        <div className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-400/40 bg-slate-100/70 px-6 py-4 shadow-md">
                            <div className="flex items-center gap-2">
                                {user ? (
                                    <p className="text-xl font-bold text-slate-800">
                                        {t('dynamicRoute.modulePage.greetingPrefix')}{' '}
                                        <span className="text-blue-600">{userDisplayName}</span>
                                    </p>
                                ) : (
                                    <p className="text-xl font-semibold text-slate-700">
                                        {t('dynamicRoute.modulePage.systemTitle')}
                                    </p>
                                )}
                            </div>
                            {user && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => logout()}
                                    isDisabled={isLoading}
                                    className="gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {isLoading ? t('common.logoutLoading') : t('common.logout')}
                                </Button>
                            )}
                        </div>
                        {availableModules.length > 0 && (
                            <>
                                <h1 className="mt-16 text-4xl font-bold text-slate-900">
                                    {t('dynamicRoute.modulePage.selectModuleTitle')}
                                </h1>
                                <p className="text-lg text-slate-600">
                                    {t('dynamicRoute.modulePage.selectModuleDescription')}
                                </p>
                            </>
                        )}
                    </header>
                )}

                {hasSystemError ? (
                    <div className="flex-1 flex flex-col items-center justify-center pb-20">
                        <div className="w-full max-w-lg rounded-2xl border-2 border-slate-400/40 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
                            <div className="space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <ShieldAlert className="h-8 w-8 text-red-500" />
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-800">{t('common.appError.title')}</h1>
                                    <p className="mt-2 text-base text-pretty text-slate-600">
                                        {t('common.appError.description')}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="xl"
                                    className="w-full"
                                    onClick={() => window.location.reload()}
                                >
                                    <RotateCcw />
                                    {t('common.appError.reload')}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : hasNoAccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center pb-20">
                        <div className="w-full max-w-lg rounded-2xl border-2 border-slate-400/40 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
                            <div className="space-y-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                        <ShieldAlert className="h-8 w-8 text-red-500" />
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-800">
                                        {t('dynamicRoute.modulePage.accessDeniedTitle')}
                                    </h1>
                                    <p className="mt-2 text-base text-pretty text-slate-600">
                                        {t('dynamicRoute.modulePage.accessDeniedDescription')}
                                    </p>
                                </div>
                                <Button variant="destructive" size="xl" className="w-full" onClick={handleBackToLogin}>
                                    <LogIn />
                                    {t('dynamicRoute.modulePage.backToLogin')}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`mt-2 pb-8 ${containerConfig}`}>
                        {availableModules.map(module => {
                            const IconComponent = (LucideIcons[module.icon as keyof typeof LucideIcons] ||
                                LucideIcons.Settings) as React.ComponentType<any>
                            // Per-module card colours keyed by the module root URL segment; projects add entries here.
                            const colors = {
                                sa: {
                                    border: 'border-slate-400/40',
                                    bg: 'bg-slate-100/70',
                                    text: 'text-slate-700',
                                    icon: 'text-slate-600',
                                    glow: 'hover:shadow-slate-400/25',
                                },
                            }
                            const colorTheme = colors[module.colorKey as keyof typeof colors] || {
                                border: 'border-gray-400/40',
                                bg: 'bg-gray-100/70',
                                text: 'text-gray-700',
                                icon: 'text-gray-600',
                                glow: 'hover:shadow-gray-400/25',
                            }

                            return (
                                <div
                                    key={module.id}
                                    className={`cursor-pointer group relative overflow-hidden rounded-2xl border-2 ${colorTheme.border} ${colorTheme.bg} shadow-md transition-all duration-200 hover:shadow-2xl ${colorTheme.glow} hover:-translate-y-1 w-full sm:w-[calc(50%-12px)]`}
                                    onClick={() =>
                                        navigate({
                                            to: '/$',
                                            params: { _splat: module.route.replace(/^\//, '') },
                                        })
                                    }
                                >
                                    <ModuleCardPattern colorKey={module.colorKey} />
                                    <div className="relative flex flex-col items-center justify-center gap-[18px] p-9 h-60">
                                        <div
                                            className={`rounded-full ${colorTheme.bg} p-[18px] shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:shadow-md`}
                                        >
                                            {IconComponent && (
                                                <IconComponent className={`h-[72px] w-[72px] ${colorTheme.icon}`} />
                                            )}
                                        </div>
                                        <span
                                            className={`whitespace-nowrap text-center text-xl font-bold ${colorTheme.text}`}
                                        >
                                            {module.name}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
