import { StatusEnum } from '@/constants/options'
import type { BaseStatus } from '@/types/api.types'
import type { RoleResponse, RoleDetailResponse } from '../types'

export interface RoleSummaryDto {
    id: string
    code: string
    name: string
    status: string
    createdDate: string
    createdBy: string
    updatedDate?: string
    updatedBy?: string
}

export interface RoleDetailDto extends RoleSummaryDto {
    permissionIds: string[]
}

const toRoleStatus = (value?: string): BaseStatus => {
    switch (value) {
        case StatusEnum.ACTIVE:
        case StatusEnum.INACTIVE:
            return value as BaseStatus
        default:
            return StatusEnum.ACTIVE as BaseStatus
    }
}

export const mapSummaryToResponse = (item: RoleSummaryDto): RoleResponse => ({
    id: item.id,
    code: item.code,
    name: item.name,
    status: toRoleStatus(item.status),
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})

export const mapDetailToResponse = (item: RoleDetailDto): RoleDetailResponse => ({
    id: item.id,
    code: item.code,
    name: item.name,
    status: toRoleStatus(item.status),
    permissionIds: item.permissionIds || [],
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})
