import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
    ExternalUserCreateRequest,
    ExternalUserUpdateRequest,
    ExternalUserFilterRequest,
    ExternalUserResponse,
    ExternalUserDetailResponse,
    ExternalUserPageResponse,
} from '../types'

export const searchExternalUsers = async (
    params: ExternalUserFilterRequest,
): Promise<PaginatedResponse<ExternalUserResponse>> => {
    const response: ApiResponse<ExternalUserPageResponse> = await request.get('sa/external-user/search', {
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

export const fetchExternalUserDetail = async (id: string): Promise<ExternalUserDetailResponse | undefined> => {
    const response: ApiResponse<ExternalUserDetailResponse> = await request.get(`sa/external-user/${id}`)
    return response.data || undefined
}

export const createExternalUser = async (data: ExternalUserCreateRequest): Promise<void> => {
    await request.post('sa/external-user/create', data)
}

export const updateExternalUser = async (data: ExternalUserUpdateRequest): Promise<void> => {
    await request.post('sa/external-user/update', data)
}

export const deleteExternalUser = async (id: string): Promise<void> => {
    await request.post('sa/external-user/delete', { id })
}

export const activeExternalUser = async (id: string): Promise<void> => {
    await request.post('sa/external-user/active', { id })
}

export const inactiveExternalUser = async (id: string): Promise<void> => {
    await request.post('sa/external-user/inactive', { id })
}

export const activeExternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/external-user/active-bulk', { ids })
}

export const inactiveExternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/external-user/inactive-bulk', { ids })
}

export const deleteExternalUserBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/external-user/delete-bulk', { ids })
}

export const resetPassword = async (id: string): Promise<void> => {
    await request.post('sa/external-user/reset-password', { id })
}

export const resetPasswordBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/external-user/reset-password-bulk', { ids })
}
