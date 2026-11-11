import { BaseAuditableResponse, BasePaginationResponse } from '@/types/api.types'
import { EmailOutboxStatusEnum } from '@/constants/options'

export { EmailOutboxStatusEnum }
export type StatusEmailOutbox = EmailOutboxStatusEnum

export interface EmailOutboxResponse extends BaseAuditableResponse {
    id: string
    eventType: string
    receiver: string
    subject?: string
    status: StatusEmailOutbox
    retryCount: number
    sentAt?: string
}

export interface EmailOutboxDetailResponse extends EmailOutboxResponse {
    body?: string
    variables?: string
    errorMessage?: string
}

export interface EmailOutboxPageResponse extends BasePaginationResponse {
    items: EmailOutboxResponse[]
}
export { EMAIL_OUTBOX_STATUS_OPTIONS } from '@/constants/options'
export { EMAIL_OUTBOX_EVENT_TYPE_OPTIONS, EmailOutboxEventTypeEnum } from '@/constants/options'
