import { PermissionTypeEnum } from '@/constants/options'
import type { BaseStatus } from '@/types/api.types'

export interface PermissionResponse {
    id: string
    code: string
    name: string
    foreignName?: string | null
    parentCode: string | null
    type: PermissionTypeEnum
    moduleCode?: string
    url?: string | null
    sortOrder?: number | null
    status: BaseStatus
}

export interface PermissionFunctionResponse {
    id: string
    code: string
    name: string
    buttonAction?: string | null
    uri?: string | null
    method?: string | null
    sortOrder?: number | null
    status: BaseStatus
}

export interface PermissionApiResponse {
    id: string
    code: string
    name: string
    uri?: string | null
    method?: string | null
    sortOrder?: number | null
    status: BaseStatus
}

export interface PermissionDetailResponse extends PermissionResponse {
    urlSegment?: string | null
    pathFolder?: string | null
    uri?: string | null
    method?: string | null
    icon?: string | null
    description?: string | null
    functions?: PermissionFunctionResponse[]
    apis?: PermissionApiResponse[]
}
