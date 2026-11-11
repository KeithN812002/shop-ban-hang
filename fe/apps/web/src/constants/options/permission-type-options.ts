export enum PermissionTypeEnum {
    MODULE = 'ROOT',
    GROUP = 'GROUP',
    MENU = 'MENU',
    PAGE = 'PAGE',
    FUNCTION = 'FUNCTION',
    API = 'API',
}

export const PERMISSION_TYPE_OPTIONS = [
    { value: PermissionTypeEnum.MODULE, label: 'permission.typeLabels.module' },
    { value: PermissionTypeEnum.GROUP, label: 'permission.typeLabels.group' },
    { value: PermissionTypeEnum.MENU, label: 'permission.typeLabels.menu' },
    { value: PermissionTypeEnum.PAGE, label: 'permission.typeLabels.page' },
] as const
