import { BaseAuditableResponse, BasePaginationResponse, TemplateVariableInfo } from '@/types/api.types'
import { EmailOutboxEventTypeEnum, StatusEnum, STATUS_OPTIONS } from '@/constants/options'

export {
    EMAIL_OUTBOX_EVENT_TYPE_OPTIONS,
    EmailOutboxEventTypeEnum,
    STATUS_OPTIONS,
    StatusEnum,
} from '@/constants/options'

export interface EmailTemplateResponse extends BaseAuditableResponse {
    id: string
    eventType: EmailOutboxEventTypeEnum
    subjectTemplate: string
    status: StatusEnum
}

export interface EmailTemplateDetailResponse extends EmailTemplateResponse {
    bodyTemplate?: string
    variables?: TemplateVariableInfo[]
}

export interface EmailTemplatePageResponse extends BasePaginationResponse {
    items: EmailTemplateResponse[]
}
