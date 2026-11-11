import type { EmailOutboxResponse, EmailOutboxDetailResponse } from '../types'

export const mapSummaryToResponse = (item: EmailOutboxResponse): EmailOutboxResponse => ({
    id: item.id,
    eventType: item.eventType,
    receiver: item.receiver,
    subject: item.subject,
    status: item.status,
    retryCount: item.retryCount,
    sentAt: item.sentAt,
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})

export const mapDetailToResponse = (item: EmailOutboxDetailResponse): EmailOutboxDetailResponse => ({
    id: item.id,
    eventType: item.eventType,
    receiver: item.receiver,
    subject: item.subject,
    body: item.body,
    status: item.status,
    variables: item.variables,
    retryCount: item.retryCount,
    sentAt: item.sentAt,
    errorMessage: item.errorMessage,
    createdDate: item.createdDate,
    createdBy: item.createdBy,
    updatedDate: item.updatedDate,
    updatedBy: item.updatedBy,
})
