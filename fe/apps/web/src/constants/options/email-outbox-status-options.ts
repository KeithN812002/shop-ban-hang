export enum EmailOutboxStatusEnum {
    NEW = 'NEW',
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SUCCESS = 'SUCCESS',
    FAIL = 'FAIL',
    CANCELLED = 'CANCELLED',
}

export const EMAIL_OUTBOX_STATUS_OPTIONS = [
    { value: EmailOutboxStatusEnum.NEW, label: 'emailOutbox.status.new' },
    { value: EmailOutboxStatusEnum.PENDING, label: 'emailOutbox.status.pending' },
    { value: EmailOutboxStatusEnum.PROCESSING, label: 'emailOutbox.status.processing' },
    { value: EmailOutboxStatusEnum.SUCCESS, label: 'emailOutbox.status.success' },
    { value: EmailOutboxStatusEnum.FAIL, label: 'emailOutbox.status.fail' },
    { value: EmailOutboxStatusEnum.CANCELLED, label: 'emailOutbox.status.cancelled' },
] as const

export const EMAIL_OUTBOX_STATUS_COLOR_MAP: Record<string, string> = {
    [EmailOutboxStatusEnum.SUCCESS]:
        'border-green-500/30 bg-green-50 text-green-600 dark:border-green-400/30 dark:bg-green-950/40 dark:text-green-400 font-semibold',
    [EmailOutboxStatusEnum.FAIL]:
        'border-red-500/30 bg-red-50 text-red-600 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-400 font-semibold',
    [EmailOutboxStatusEnum.NEW]:
        'border-blue-500/30 bg-blue-50 text-blue-600 dark:border-blue-400/30 dark:bg-blue-950/40 dark:text-blue-400 font-semibold',
    [EmailOutboxStatusEnum.PENDING]:
        'border-amber-500/30 bg-amber-50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-400 font-semibold',
    [EmailOutboxStatusEnum.PROCESSING]:
        'border-indigo-500/30 bg-indigo-50 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold',
    [EmailOutboxStatusEnum.CANCELLED]:
        'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-950/40 dark:text-slate-400 font-semibold',
}
