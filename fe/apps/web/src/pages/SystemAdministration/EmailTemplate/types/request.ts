import type { PagingBase } from '@/types/api.types'
import type { EmailOutboxEventTypeEnum } from './model'
import { StatusEnum } from '@/constants/options'

export interface EmailTemplateFilterRequest extends PagingBase {
    eventType?: EmailOutboxEventTypeEnum[]
    subjectTemplate?: string
    status?: StatusEnum[]
    createdBy?: string
    createdDateFrom?: string
    createdDateTo?: string
    updatedBy?: string
    updatedDateFrom?: string
    updatedDateTo?: string
}

export interface EmailTemplateUpdateRequest {
    id: string
    subjectTemplate: string
    bodyTemplate: string
    status: StatusEnum
}
