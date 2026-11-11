import { StatusEnum } from '@/constants/options'
import type { BaseStatus } from '@/types/api.types'
import {
    type PermissionResponse,
    type PermissionDetailResponse,
    type PermissionFunctionResponse,
    type PermissionApiResponse,
    type PermissionTreeNode,
} from '../types'
import { PermissionTypeEnum } from '@/constants/options'

export interface PermissionSummaryDto {
    id: string
    code: string
    name: string
    foreignName?: string | null
    parentCode: string | null
    type: string
    moduleCode?: string
    url?: string | null
    sortOrder?: number | null
    status: string
}

export interface PermissionChildDto {
    id?: string
    code?: string
    name?: string
    buttonAction?: string | null
    uri?: string | null
    method?: string | null
    sortOrder?: number | null
    status?: string
}

export interface PermissionDetailDto extends PermissionSummaryDto {
    urlSegment?: string | null
    pathFolder?: string | null
    uri?: string | null
    method?: string | null
    icon?: string | null
    description?: string | null
    functions?: PermissionChildDto[]
    apis?: PermissionChildDto[]
}

const toPermissionType = (value?: string): PermissionTypeEnum => {
    switch (value) {
        case PermissionTypeEnum.MODULE:
        case PermissionTypeEnum.GROUP:
        case PermissionTypeEnum.MENU:
        case PermissionTypeEnum.PAGE:
        case PermissionTypeEnum.FUNCTION:
        case PermissionTypeEnum.API:
            return value as PermissionTypeEnum
        default:
            return PermissionTypeEnum.MENU
    }
}

const toPermissionStatus = (value?: string): BaseStatus => {
    switch (value) {
        case StatusEnum.ACTIVE:
        case StatusEnum.INACTIVE:
            return value as BaseStatus
        default:
            return StatusEnum.ACTIVE as BaseStatus
    }
}

export const mapSummaryToResponse = (item: PermissionSummaryDto): PermissionResponse => ({
    id: item.id,
    code: item.code,
    name: item.name,
    foreignName: item.foreignName,
    parentCode: item.parentCode,
    type: toPermissionType(item.type),
    moduleCode: item.moduleCode,
    url: item.url,
    sortOrder: item.sortOrder,
    status: toPermissionStatus(item.status),
})

export const mapChildToFunctionResponse = (item: PermissionChildDto): PermissionFunctionResponse => ({
    id: item.id ?? '',
    code: item.code || '',
    name: item.name || '',
    buttonAction: item.buttonAction,
    uri: item.uri,
    method: item.method,
    sortOrder: item.sortOrder,
    status: toPermissionStatus(item.status),
})

export const mapChildToApiResponse = (item: PermissionChildDto): PermissionApiResponse => ({
    id: item.id ?? '',
    code: item.code || '',
    name: item.name || '',
    uri: item.uri,
    method: item.method,
    sortOrder: item.sortOrder,
    status: toPermissionStatus(item.status),
})

export const mapDetailToResponse = (item: PermissionDetailDto): PermissionDetailResponse => ({
    id: item.id ?? '',
    code: item.code || '',
    name: item.name || '',
    foreignName: item.foreignName,
    parentCode: item.parentCode ?? null,
    type: toPermissionType(item.type),
    moduleCode: item.moduleCode,
    sortOrder: item.sortOrder,
    status: toPermissionStatus(item.status),
    urlSegment: item.urlSegment,
    pathFolder: item.pathFolder,
    uri: item.uri,
    method: item.method,
    icon: item.icon,
    description: item.description,
    functions: (item.functions || []).map(mapChildToFunctionResponse),
    apis: (item.apis || []).map(mapChildToApiResponse),
})

export const buildPermissionTree = (permissions: PermissionResponse[]): PermissionTreeNode[] => {
    const map = new Map<string, PermissionTreeNode>()
    const roots: PermissionTreeNode[] = []

    permissions.forEach(p => {
        map.set(p.code, { ...p, children: [] })
    })

    permissions.forEach(p => {
        const node = map.get(p.code)
        if (!node) return

        if (p.parentCode && map.has(p.parentCode)) {
            const parent = map.get(p.parentCode)
            if (!parent) return

            parent.children = parent.children || []
            parent.children.push(node)
        } else {
            roots.push(node)
        }
    })

    const sortByOrder = (nodes: PermissionTreeNode[]) => {
        nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        nodes.forEach(node => {
            if (node.children?.length) {
                sortByOrder(node.children)
            }
        })
    }

    sortByOrder(roots)
    return roots
}
