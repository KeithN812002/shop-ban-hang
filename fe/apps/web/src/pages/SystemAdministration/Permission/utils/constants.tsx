import { Boxes, LayoutList, Menu as MenuIcon, PanelsTopLeft, Lock, Zap } from 'lucide-react'
import { PermissionTypeEnum } from '@/constants/options'

export const SIDEBAR_MENU_TYPES = new Set([
    PermissionTypeEnum.MODULE,
    PermissionTypeEnum.GROUP,
    PermissionTypeEnum.MENU,
    PermissionTypeEnum.PAGE,
])

export const TYPE_ICON_MAP: Record<string, { Icon: typeof Boxes; className: string }> = {
    [PermissionTypeEnum.MODULE]: { Icon: Boxes, className: 'text-red-500' },
    [PermissionTypeEnum.GROUP]: { Icon: LayoutList, className: 'text-amber-500' },
    [PermissionTypeEnum.MENU]: { Icon: MenuIcon, className: 'text-blue-500' },
    [PermissionTypeEnum.PAGE]: { Icon: PanelsTopLeft, className: 'text-indigo-500' },
    [PermissionTypeEnum.FUNCTION]: { Icon: Zap, className: 'text-green-500' },
    [PermissionTypeEnum.API]: { Icon: Lock, className: 'text-purple-500' },
    default: { Icon: MenuIcon, className: 'text-gray-500' },
}

export const isSidebarMenuType = (type: string) => SIDEBAR_MENU_TYPES.has(type as PermissionTypeEnum)

export const getIcon = (type: string) => {
    const { Icon, className } = TYPE_ICON_MAP[type] || TYPE_ICON_MAP.default
    return <Icon className={`size-4 ${className}`} />
}

export const urlSegmentRules = (message: string) => ({
    validate: (value?: string) => !value || value.startsWith('/') || message,
})
