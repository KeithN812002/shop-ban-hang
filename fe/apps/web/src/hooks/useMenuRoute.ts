import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMenuData } from '@/providers/MenuDataProvider'
import { useMenuPermission } from '@/providers/MenuPermissionProvider'
import { normalizeMenuFolder as normalizeFolder, stripBasePath } from '@/utils/menu.utils'
import { PermissionTypeEnum } from '@/constants/options'

const toSplat = (url: string, params: Record<string, string> = {}): string | null => {
    let resolved = url
    for (const [key, value] of Object.entries(params)) {
        resolved = resolved.replaceAll(`{${key}}`, value)
    }
    if (resolved.includes('{')) {
        console.warn(`[useMenuRoute] Unresolved placeholder in "${resolved}"`)
        return null
    }
    const clean = stripBasePath(resolved).split('?')[0]
    const noTrailing = clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean
    return noTrailing.startsWith('/') ? noTrailing.slice(1) : noTrailing
}

interface NavigateOptions {
    search?: Record<string, unknown>
}

interface ParentNavigateOptions extends NavigateOptions {
    params?: Record<string, string>
}

export function useMenuRoute() {
    const navigate = useNavigate()
    const { menuData } = useMenuData()
    const { findMenuByUrl, findMenuByCode } = useMenuPermission()

    const resolveChildPageUrl = useCallback(
        (parentMenuCode: string | undefined, pathFolder: string): string | null => {
            if (!parentMenuCode) return null
            const match = menuData.find(
                menu =>
                    menu.Status === 'A' &&
                    menu.ModuleType === PermissionTypeEnum.PAGE &&
                    menu.ParentCode === parentMenuCode &&
                    normalizeFolder(menu.PathFolder) === normalizeFolder(pathFolder),
            )
            return match?.Url ?? null
        },
        [menuData],
    )

    const navigateToPage = useCallback(
        (
            parentMenuCode: string | undefined,
            pathFolder: string,
            pathParams: Record<string, string> = {},
            options?: NavigateOptions,
        ) => {
            const url = resolveChildPageUrl(parentMenuCode, pathFolder)
            if (!url) {
                console.warn(`[useMenuRoute] No PAGE menu for folder "${pathFolder}" under parent "${parentMenuCode}"`)
                return
            }
            const splat = toSplat(url, pathParams)
            if (!splat) return
            navigate({ to: '/$', params: { _splat: splat }, search: options?.search })
        },
        [navigate, resolveChildPageUrl],
    )

    const resolveSplatOfChildPage = useCallback(
        (
            parentMenuCode: string | undefined,
            pathFolder: string,
            params: Record<string, string> = {},
        ): string | null => {
            const url = resolveChildPageUrl(parentMenuCode, pathFolder)
            return url ? toSplat(url, params) : null
        },
        [resolveChildPageUrl],
    )

    const navigateToParentMenu = useCallback(
        (currentPathname: string, options?: ParentNavigateOptions) => {
            const current = findMenuByUrl(currentPathname)
            const parent = current?.ParentCode ? findMenuByCode(current.ParentCode) : null
            if (!parent?.Url) {
                console.warn(`[useMenuRoute] No parent MENU for path "${currentPathname}"`)
                return
            }
            const splat = toSplat(parent.Url, options?.params)
            if (!splat) return
            navigate({ to: '/$', params: { _splat: splat }, search: options?.search })
        },
        [navigate, findMenuByUrl, findMenuByCode],
    )

    const resolveUrlByFolder = useCallback(
        (pathFolder: string): string | null => {
            const matches = menuData.filter(
                menu => menu.Status === 'A' && normalizeFolder(menu.PathFolder) === normalizeFolder(pathFolder),
            )
            if (matches.length > 1) {
                console.warn(`[useMenuRoute] Ambiguous folder "${pathFolder}" (${matches.length} matches)`)
            }
            return matches[0]?.Url ?? null
        },
        [menuData],
    )

    const resolveSplatByFolder = useCallback(
        (pathFolder: string, params: Record<string, string> = {}): string | null => {
            const url = resolveUrlByFolder(pathFolder)
            return url ? toSplat(url, params) : null
        },
        [resolveUrlByFolder],
    )

    const navigateByFolder = useCallback(
        (pathFolder: string, options?: ParentNavigateOptions) => {
            const url = resolveUrlByFolder(pathFolder)
            if (!url) {
                console.warn(`[useMenuRoute] No menu for folder "${pathFolder}"`)
                return
            }
            const splat = toSplat(url, options?.params)
            if (!splat) return
            navigate({ to: '/$', params: { _splat: splat }, search: options?.search })
        },
        [navigate, resolveUrlByFolder],
    )

    const resolveSplatOfChildPath = useCallback(
        (currentPathname: string, pathFolder: string, pathParams: Record<string, string> = {}): string | null => {
            const current = findMenuByUrl(currentPathname)
            const url = resolveChildPageUrl(current?.MenuCode, pathFolder)
            return url ? toSplat(url, pathParams) : null
        },
        [findMenuByUrl, resolveChildPageUrl],
    )

    const navigateToChildOfPath = useCallback(
        (
            currentPathname: string,
            pathFolder: string,
            pathParams: Record<string, string> = {},
            options?: NavigateOptions,
        ) => {
            const current = findMenuByUrl(currentPathname)
            if (!current) {
                console.warn(`[useMenuRoute] No menu for path "${currentPathname}"`)
                return
            }
            navigateToPage(current.MenuCode, pathFolder, pathParams, options)
        },
        [findMenuByUrl, navigateToPage],
    )

    return {
        resolveChildPageUrl,
        resolveSplatOfChildPage,
        resolveUrlByFolder,
        resolveSplatByFolder,
        resolveSplatOfChildPath,
        navigateToPage,
        navigateByFolder,
        navigateToParentMenu,
        navigateToChildOfPath,
    }
}
