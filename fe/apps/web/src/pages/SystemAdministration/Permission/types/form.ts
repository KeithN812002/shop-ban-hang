import { PermissionTypeEnum } from '@/constants/options'
import type { PermissionResponse } from './model'
import type { BaseStatus } from '@/types/api.types'

export interface PermissionTreeNode extends PermissionResponse {
    children?: PermissionTreeNode[]
}

export interface FnFormRow {
    _key: string
    id?: string | null
    _deleted?: boolean
    code: string
    name: string
    uri?: string
    method: string
    buttonAction: string
    sortOrder: number
    status: BaseStatus
}

export interface ApiFormRow {
    _key: string
    id?: string | null
    _deleted?: boolean
    code: string
    name: string
    uri?: string
    method: string
    sortOrder: number
    status: BaseStatus
}

export interface PermissionFormData {
    id?: string
    code: string
    name: string
    foreignName: string
    parentCode: string
    type: PermissionTypeEnum
    urlSegment: string
    pathFolder: string
    uri: string
    method: string
    icon: string
    sortOrder: number
    description: string
    status: BaseStatus
    functions: FnFormRow[]
    apis: ApiFormRow[]
}
