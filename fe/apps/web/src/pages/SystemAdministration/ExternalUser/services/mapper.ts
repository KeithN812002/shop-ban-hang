import type { BaseStatus } from '@/types/api.types'
import type { ExternalUserResponse, ExternalUserDetailResponse } from '../types'
import { StatusEnum } from '@/constants/options'

const toUserStatus = (value?: string): BaseStatus => {
    switch (value) {
        case StatusEnum.ACTIVE:
        case StatusEnum.INACTIVE:
            return value as BaseStatus
        default:
            return StatusEnum.ACTIVE as BaseStatus
    }
}

export const mapSummaryToResponse = (item: ExternalUserResponse): ExternalUserResponse => ({
    id: item.id,
    userName: item.userName,
    personalName: item.personalName,
    email: item.email,
    externalUnitCode: item.externalUnitCode,
    status: toUserStatus(item.status),
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})

export const mapDetailToResponse = (item: ExternalUserDetailResponse): ExternalUserDetailResponse => ({
    id: item.id,
    userName: item.userName,
    personalName: item.personalName,
    email: item.email,
    externalUnitCode: item.externalUnitCode,
    roles: item.roles || [],
    status: toUserStatus(item.status),
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})
