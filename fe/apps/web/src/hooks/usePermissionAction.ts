import { useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { useActiveMenu } from '@/providers/ActiveMenuProvider'
import { PermissionTypeEnum } from '@/constants/options'
import { env } from '@/config/env'

/**
 * Hook to check if current user has permission for a specific action (type: 'F')
 * @param menuCode Optional menu code to check against. If not provided, it will expect it in checkPermission
 */
export function usePermissionAction(menuCode?: string) {
    const { user } = useAuth()
    const activeMenu = useActiveMenu()
    const defaultMenuCode = menuCode || activeMenu?.MenuCode

    const checkPermission = useCallback(
        (actionCode: string, targetMenuCode?: string) => {
            const finalMenuCode = targetMenuCode || defaultMenuCode
            if (!user || !user.permissions || !finalMenuCode) return false

            return user.permissions.some(
                p =>
                    p.type === PermissionTypeEnum.FUNCTION &&
                    p.parentCode === finalMenuCode &&
                    p.buttonAction === actionCode &&
                    !env.blockedFunctions.includes(p.code.toUpperCase()),
            )
        },
        [user, defaultMenuCode],
    )

    return { checkPermission }
}
