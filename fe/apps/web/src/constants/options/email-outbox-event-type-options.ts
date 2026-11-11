export enum EmailOutboxEventTypeEnum {
    RESET_PASSWORD = 'RESET_PASSWORD',
    CREATE_USER = 'CREATE_USER',
    OTP_CHANGE_PASSWORD = 'OTP_CHANGE_PASSWORD',
    UPDATE_USER = 'UPDATE_USER',
}

// Which config module owns each event type. Mirrors sa_email_template.module, which is the
// source of truth on the BE - changing one without the other makes the filter list disagree
// with the rows the API returns. Projects add their own modules and event types here.
export enum EmailTemplateModuleEnum {
    SA = 'SA',
}

export const EMAIL_OUTBOX_EVENT_TYPE_OPTIONS = [
    {
        value: EmailOutboxEventTypeEnum.RESET_PASSWORD,
        label: 'emailOutbox.eventType.RESET_PASSWORD',
        module: EmailTemplateModuleEnum.SA,
    },
    {
        value: EmailOutboxEventTypeEnum.CREATE_USER,
        label: 'emailOutbox.eventType.CREATE_USER',
        module: EmailTemplateModuleEnum.SA,
    },
    {
        value: EmailOutboxEventTypeEnum.OTP_CHANGE_PASSWORD,
        label: 'emailOutbox.eventType.OTP_CHANGE_PASSWORD',
        module: EmailTemplateModuleEnum.SA,
    },
    {
        value: EmailOutboxEventTypeEnum.UPDATE_USER,
        label: 'emailOutbox.eventType.UPDATE_USER',
        module: EmailTemplateModuleEnum.SA,
    },
] as const
