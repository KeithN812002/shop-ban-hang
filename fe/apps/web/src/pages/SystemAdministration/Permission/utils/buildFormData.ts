import { StatusEnum } from '@/constants/options/status-options'
import type {
    PermissionCreateRequest,
    PermissionDetailResponse,
    PermissionFormData,
    PermissionUpdateRequest,
} from '../types'
import { PermissionTypeEnum } from '@/constants/options'

export const DEFAULT_FORM_DATA: Omit<PermissionFormData, 'code' | 'parentCode' | 'type'> = {
    name: '',
    foreignName: '',
    urlSegment: '',
    pathFolder: '',
    uri: '',
    method: 'GET',
    icon: 'Home',
    sortOrder: 1,
    description: '',
    status: StatusEnum.ACTIVE,
    functions: [],
    apis: [],
}

export const buildFormDataFromItem = (item: PermissionDetailResponse): PermissionFormData => ({
    id: item.id,
    code: item.code ?? '',
    name: item.name ?? '',
    foreignName: item.foreignName ?? '',
    parentCode: item.parentCode ?? '',
    type: item.type,
    urlSegment: item.urlSegment ?? '',
    pathFolder: item.pathFolder ?? '',
    uri: item.uri ?? '',
    method: item.method ?? 'GET',
    icon: item.icon ?? '',
    sortOrder: item.sortOrder ?? 0,
    description: item.description ?? '',
    status: item.status,
    functions: (item.functions ?? []).map((fn, i) => ({
        _key: `fn_${fn.id}_${fn.code}_${i}`,
        id: fn.id,
        code: fn.code ?? '',
        name: fn.name ?? '',
        uri: fn.uri ?? '',
        method: fn.method ?? '',
        buttonAction: fn.buttonAction ?? '',
        sortOrder: fn.sortOrder ?? 0,
        status: fn.status,
    })),
    apis: (item.apis ?? []).map((api, i) => ({
        _key: `api_${api.id}_${api.code}_${i}`,
        id: api.id,
        code: api.code ?? '',
        name: api.name ?? '',
        uri: api.uri ?? '',
        method: api.method ?? '',
        sortOrder: api.sortOrder ?? 0,
        status: api.status,
    })),
})

export const buildEmptyFormData = (
    parentCode?: string | null,
    parentType?: string | null,
    newItemType?: PermissionTypeEnum.GROUP | PermissionTypeEnum.MENU | PermissionTypeEnum.PAGE,
): PermissionFormData => {
    const parentCodeVal = parentCode ?? ''

    if (newItemType === PermissionTypeEnum.GROUP) {
        return {
            ...DEFAULT_FORM_DATA,
            code: 'GROUP_XXXXXX',
            parentCode: parentCodeVal,
            type: PermissionTypeEnum.GROUP,
        }
    }

    if (newItemType === PermissionTypeEnum.MENU) {
        return {
            ...DEFAULT_FORM_DATA,
            code: 'MENU_XXXXXX',
            parentCode: parentCodeVal,
            type: PermissionTypeEnum.MENU,
        }
    }

    if (newItemType === PermissionTypeEnum.PAGE || parentType === PermissionTypeEnum.MENU) {
        return {
            ...DEFAULT_FORM_DATA,
            code: 'PAGE_XXXXXX',
            parentCode: parentCodeVal,
            type: PermissionTypeEnum.PAGE,
            icon: '',
        }
    }

    return {
        ...DEFAULT_FORM_DATA,
        code: 'GROUP_XXXXXX',
        parentCode: parentCodeVal,
        type: PermissionTypeEnum.GROUP,
    }
}

export const buildPayload = (data: PermissionFormData): PermissionUpdateRequest => {
    if (!data.id) {
        throw new Error('Permission id is required for update payload')
    }

    return {
        id: data.id,
        name: data.name,
        foreignName: data.foreignName,
        parentCode: data.parentCode,
        urlSegment: data.urlSegment,
        pathFolder: data.pathFolder || null,
        icon: data.icon,
        sortOrder: data.sortOrder,
        description: data.description,
        status: data.status,
        uri: data.uri,
        method: data.method,
        functions: (data.functions || [])
            .filter(fn => !fn._deleted)
            .map(fn => ({
                id: fn.id,
                name: fn.name,
                uri: fn.uri,
                method: fn.method,
                buttonAction: fn.buttonAction,
                sortOrder: fn.sortOrder,
                status: fn.status,
            })),
        apis: (data.apis || [])
            .filter(api => !api._deleted)
            .map(api => ({
                id: api.id,
                name: api.name,
                uri: api.uri,
                method: api.method,
                sortOrder: api.sortOrder,
                status: api.status,
            })),
    }
}

export const buildCreatePayload = (data: PermissionFormData): PermissionCreateRequest => ({
    name: data.name,
    foreignName: data.foreignName,
    parentCode: data.parentCode,
    urlSegment: data.urlSegment,
    pathFolder: data.pathFolder,
    icon: data.icon,
    sortOrder: data.sortOrder,
    description: data.description,
    status: data.status,
    type: data.type,
    uri: data.uri,
    method: data.method,
    functions: (data.functions || [])
        .filter(fn => !fn._deleted)
        .map(fn => ({
            name: fn.name,
            uri: fn.uri,
            method: fn.method,
            buttonAction: fn.buttonAction,
            sortOrder: fn.sortOrder,
            status: fn.status,
        })),
    apis: (data.apis || [])
        .filter(api => !api._deleted)
        .map(api => ({
            name: api.name,
            uri: api.uri,
            method: api.method,
            sortOrder: api.sortOrder,
            status: api.status,
        })),
})
