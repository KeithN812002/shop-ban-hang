import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
    InternalUserFilterRequest,
    InternalUserAssignRoleRequest,
    InternalUserResponse,
    InternalUserDetailResponse,
    InternalUserPageResponse,
} from '../types'

export const searchInternalUsers = async (
    params: InternalUserFilterRequest,
): Promise<PaginatedResponse<InternalUserResponse>> => {
    const response: ApiResponse<InternalUserPageResponse> = await request.get('sa/internal-user/search', {
        params: cleanParams(params),
    })
    const payload = response.data

    if (!payload) {
        return { items: [], total: 0, totalPages: 0, page: 1, pageSize: params.pageSize || 20 }
    }

    return {
        items: payload.items || [],
        total: payload.total ?? payload.totalElements ?? 0,
        totalPages: payload.totalPages ?? 0,
        page: payload.page ?? payload.pageNumber ?? 1,
        pageSize: payload.pageSize ?? (params.pageSize || 20),
    }
}

export const fetchInternalUserDetail = async (id: string): Promise<InternalUserDetailResponse | undefined> => {
    const response: ApiResponse<InternalUserDetailResponse> = await request.get(`sa/internal-user/${id}`)
    return response.data || undefined
}

export const assignInternalUserRoles = async (data: InternalUserAssignRoleRequest): Promise<void> => {
    await request.post('sa/internal-user/assign-roles', data)
}

export const activeInternalUser = async (id: string): Promise<void> => {
    await request.post('sa/internal-user/active', { id })
}

export const inactiveInternalUser = async (id: string): Promise<void> => {
    await request.post('sa/internal-user/inactive', { id })
}

export const deleteInternalUser = async (id: string): Promise<void> => {
    await request.post('sa/internal-user/delete', { id })
}

export const activeInternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/internal-user/active-bulk', { ids })
}

export const inactiveInternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/internal-user/inactive-bulk', { ids })
}

export const deleteInternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/internal-user/delete-bulk', { ids })
}
