import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
    EmailTemplateFilterRequest,
    EmailTemplateResponse,
    EmailTemplateDetailResponse,
    EmailTemplatePageResponse,
    EmailTemplateUpdateRequest,
} from '../types'
import type { EmailTemplateModuleType } from '../utils/emailTemplateScope'

export const searchEmailTemplate = async (
    moduleType: EmailTemplateModuleType,
    params: EmailTemplateFilterRequest,
): Promise<PaginatedResponse<EmailTemplateResponse>> => {
    const response: ApiResponse<EmailTemplatePageResponse> = await request.get(
        `sa/email-template/${moduleType}/search`,
        { params: cleanParams(params) },
    )
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

export const fetchEmailTemplateDetail = async (
    moduleType: EmailTemplateModuleType,
    id: string,
): Promise<EmailTemplateDetailResponse | undefined> => {
    const response: ApiResponse<EmailTemplateDetailResponse> = await request.get(
        `sa/email-template/${moduleType}/${id}`,
    )
    return response.data || undefined
}

export const updateEmailTemplate = async (
    moduleType: EmailTemplateModuleType,
    data: EmailTemplateUpdateRequest,
): Promise<void> => {
    await request.post(`sa/email-template/${moduleType}/update`, data)
}

export const activeEmailTemplate = async (moduleType: EmailTemplateModuleType, id: string): Promise<void> => {
    await request.post(`sa/email-template/${moduleType}/active`, { id })
}

export const inactiveEmailTemplate = async (moduleType: EmailTemplateModuleType, id: string): Promise<void> => {
    await request.post(`sa/email-template/${moduleType}/inactive`, { id })
}

export const activeEmailTemplateBulk = async (moduleType: EmailTemplateModuleType, ids: string[]): Promise<void> => {
    await request.post(`sa/email-template/${moduleType}/active-bulk`, { ids })
}

export const inactiveEmailTemplateBulk = async (moduleType: EmailTemplateModuleType, ids: string[]): Promise<void> => {
    await request.post(`sa/email-template/${moduleType}/inactive-bulk`, { ids })
}
