import type { MenuItem } from '@/types/menu.types'
import { EMAIL_OUTBOX_EVENT_TYPE_OPTIONS, EmailTemplateModuleEnum } from '@/constants/options'

// The `{type}` segment of `sa/email-template/{type}/*`. The core only owns the `sa` templates;
// a project that adds modules extends this list, the map below and `EmailTemplateModuleEnum`.
export type EmailTemplateModuleType = 'sa'

export const EMAIL_TEMPLATE_MODULE_TYPES: EmailTemplateModuleType[] = ['sa']

const isModuleType = (value?: string): value is EmailTemplateModuleType =>
    !!value && EMAIL_TEMPLATE_MODULE_TYPES.includes(value as EmailTemplateModuleType)

// Each entry point only sees its own module: the menu's module code selects the template set.
export const resolveEmailTemplateModuleType = (menuItem?: MenuItem): EmailTemplateModuleType => {
    const moduleCode = menuItem?.ModuleCode?.toLowerCase()
    return isModuleType(moduleCode) ? moduleCode : 'sa'
}

const MODULE_TYPE_TO_MODULE: Record<EmailTemplateModuleType, EmailTemplateModuleEnum> = {
    sa: EmailTemplateModuleEnum.SA,
}

export const getEmailTemplateModule = (moduleType: EmailTemplateModuleType): EmailTemplateModuleEnum =>
    MODULE_TYPE_TO_MODULE[moduleType]

// The event type dropdown must only offer types the current module owns, otherwise the filter
// lets you pick a value that can never match a row.
export const getEventTypeOptions = (moduleType: EmailTemplateModuleType) =>
    EMAIL_OUTBOX_EVENT_TYPE_OPTIONS.filter(option => option.module === getEmailTemplateModule(moduleType))
