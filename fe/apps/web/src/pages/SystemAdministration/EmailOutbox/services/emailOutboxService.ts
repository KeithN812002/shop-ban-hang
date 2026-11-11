import { request } from '@/lib/axios'
import { cleanParams } from '@/utils/api.utils'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
    EmailOutboxFilterRequest,
    EmailOutboxResponse,
    EmailOutboxDetailResponse,
    EmailOutboxPageResponse,
} from '../types'

export const searchEmailOutbox = async (
    params: EmailOutboxFilterRequest,
): Promise<PaginatedResponse<EmailOutboxResponse>> => {
    const response: ApiResponse<EmailOutboxPageResponse> = await request.get('sa/email-outbox/search', {
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

export const fetchEmailOutboxDetail = async (id: string): Promise<EmailOutboxDetailResponse | undefined> => {
    const response: ApiResponse<EmailOutboxDetailResponse> = await request.get(`sa/email-outbox/${id}`)
    return response.data || undefined
}

export const resendEmail = async (id: string): Promise<void> => {
    await request.post('sa/email-outbox/resend', { id })
}

export const resendEmailBulk = async (ids: string[]): Promise<void> => {
    await request.post('sa/email-outbox/resend-bulk', { ids })
}
