import type { PagingBase } from '@/types/api.types'
import type { StatusEmailOutbox, EmailOutboxEventTypeEnum } from './model'

export interface EmailOutboxFilterRequest extends PagingBase {
    eventType?: EmailOutboxEventTypeEnum[]
    subject?: string
    receiver?: string
    status?: StatusEmailOutbox[]
    retryCountFrom?: number
    retryCountTo?: number
    createdBy?: string
    createdDateFrom?: string
    createdDateTo?: string
    updatedBy?: string
    updatedDateFrom?: string
    updatedDateTo?: string
    sentAtFrom?: string
    sentAtTo?: string
}
