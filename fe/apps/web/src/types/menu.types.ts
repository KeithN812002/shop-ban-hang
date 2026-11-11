import { PermissionTypeEnum } from '@/constants/options'

export type MenuStatus = 'A' | 'I'

export interface MenuItem {
    Id: string
    MenuCode: string
    MenuName: string
    ForeignName?: string | null
    ParentCode: string
    AppCode: string
    ModuleCode?: string
    ModuleType: PermissionTypeEnum
    OrderNo: string
    Status: MenuStatus
    IncludeMenu: '0' | '1'
    Url: string | null
    PathFolder: string | null
    Icon: string | null
    TranslateKey: string | null
    IsUserPermission: boolean
}

export interface MenuTreeNode extends MenuItem {
    children: MenuTreeNode[]
    level: number
    isExpanded?: boolean
}

export interface MenuPermission {
    menuCode: string
    canView: boolean
    canAccess: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    canExport: boolean
    canImport: boolean
}

export interface AppModule {
    appCode: string
    appName: string
    icon?: string
    menus: MenuTreeNode[]
}

export type MenuAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'approve'

export interface BreadcrumbItem {
    label: string
    url?: string
    menuCode?: string
}
