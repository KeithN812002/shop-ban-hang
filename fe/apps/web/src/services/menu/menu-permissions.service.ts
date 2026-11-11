import { PermissionTypeEnum } from '@/constants/options'
import { getUserInfoCache } from '@/lib/storage'
import type { MenuItem } from '@/types/menu.types'

interface PermissionItem {
    type: PermissionTypeEnum
    code: string
    name: string
    foreignName?: string | null
    parentCode?: string | null
    appCode?: string | null
    moduleCode?: string
    sortOrder?: number | null
    url?: string | null
    pathFolder?: string | null
    icon?: string | null
}

const MENU_TYPES = new Set<PermissionTypeEnum>([
    PermissionTypeEnum.GROUP,
    PermissionTypeEnum.MENU,
    PermissionTypeEnum.PAGE,
])
const ROOT_TYPE = PermissionTypeEnum.MODULE
const DEFAULT_APP_CODE = 'APP'

const normalizeParentCode = (parentCode?: string | null) => parentCode || '0'

export const getMenuDataFromPermissions = (): MenuItem[] => {
    const userInfo = getUserInfoCache<{ permissions?: PermissionItem[] }>()
    if (!userInfo?.permissions) {
        return []
    }

    const rootCodes = new Set(userInfo.permissions.filter(p => p.type === ROOT_TYPE).map(p => p.code))

    return userInfo.permissions
        .filter(p => MENU_TYPES.has(p.type))
        .map((perm, index) => {
            const parentCode = normalizeParentCode(perm.parentCode)

            return {
                Id: String(index + 1),
                MenuCode: perm.code,
                MenuName: perm.name,
                ForeignName: perm.foreignName ?? null,
                ParentCode: rootCodes.has(parentCode) ? '0' : parentCode,
                AppCode: perm.appCode || perm.moduleCode || DEFAULT_APP_CODE,
                ModuleCode: perm.moduleCode || undefined,
                ModuleType: perm.type,
                OrderNo: String(perm.sortOrder || 0),
                Status: 'A',
                IncludeMenu: '1',
                Url: perm.url || '',
                PathFolder: perm.pathFolder || null,
                Icon: perm.icon ?? null,
                TranslateKey: null,
                IsUserPermission: true,
            }
        })
}
