import { PermissionTypeEnum } from '@/constants/options'
import type { BaseStatus } from '@/types/api.types'

export interface PermissionFunctionRequest {
    id?: string | null
    name: string
    uri?: string | null
    method?: string | null
    buttonAction?: string | null
    sortOrder?: number | null
    status: BaseStatus
}

export interface PermissionApiRequest {
    id?: string | null
    name: string
    uri?: string | null
    method?: string | null
    sortOrder?: number | null
    status: BaseStatus
}

export interface PermissionCreateRequest {
    name: string
    foreignName?: string | null
    parentCode: string
    type: PermissionTypeEnum
    urlSegment?: string | null
    pathFolder?: string | null
    icon?: string | null
    sortOrder?: number | null
    description?: string | null
    status: BaseStatus
    uri?: string | null
    method?: string | null
    functions?: PermissionFunctionRequest[]
    apis?: PermissionApiRequest[]
}

export interface PermissionUpdateRequest {
    id: string
    name: string
    foreignName?: string | null
    parentCode: string
    urlSegment?: string | null
    pathFolder?: string | null
    icon?: string | null
    sortOrder?: number | null
    description?: string | null
    status: BaseStatus
    uri?: string | null
    method?: string | null
    functions?: PermissionFunctionRequest[]
    apis?: PermissionApiRequest[]
}

export interface PermissionDeleteRequest {
    id: string
}
