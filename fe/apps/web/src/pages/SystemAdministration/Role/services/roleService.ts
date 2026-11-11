import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
    RoleCreateRequest,
    RoleUpdateRequest,
    RoleFilterRequest,
    RolePageResponse,
    RoleResponse,
    RoleDetailResponse,
} from '../types'
import { mapSummaryToResponse, mapDetailToResponse, type RoleDetailDto } from './mapper'

export const searchRoles = async (params: RoleFilterRequest): Promise<PaginatedResponse<RoleResponse>> => {
    const response: ApiResponse<RolePageResponse> = await request.get('sa/role/search', {
        params: cleanParams(params),
    })
    const payload = response.data

    if (!payload) {
        return { items: [], total: 0, totalPages: 0, page: 1, pageSize: params.pageSize || 20 }
    }

    return {
        items: (payload.items || []).map(mapSummaryToResponse),
        total: payload.total ?? payload.totalElements ?? 0,
        totalPages: payload.totalPages ?? 0,
        page: payload.page ?? payload.pageNumber ?? 1,
        pageSize: payload.pageSize ?? (params.pageSize || 20),
    }
}

export const fetchRoleDetail = async (id: string): Promise<RoleDetailResponse | undefined> => {
    const response: ApiResponse<RoleDetailDto> = await request.get(`sa/role/${id}`)
    return response.data ? mapDetailToResponse(response.data) : undefined
}

export const createRole = async (data: RoleCreateRequest): Promise<void> => {
    await request.post('sa/role/create', data)
}

export const updateRole = async (data: RoleUpdateRequest): Promise<void> => {
    await request.post('sa/role/update', data)
}

export const deleteRole = async (id: string): Promise<void> => {
    await request.post('sa/role/delete', { id })
}

export const activeRole = async (id: string): Promise<void> => {
    await request.post('sa/role/active', { id })
}

export const inactiveRole = async (id: string): Promise<void> => {
    await request.post('sa/role/inactive', { id })
}

export const activeRoleBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/role/active-bulk', { ids })
}

export const inactiveRoleBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/role/inactive-bulk', { ids })
}

export const deleteRoleBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/role/delete-bulk', { ids })
}
