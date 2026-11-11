import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface AuditInfoProps {
    createdDate?: string | null
    createdBy?: string | null
    updatedDate?: string | null
    updatedBy?: string | null
    className?: string
}

export const AuditInfo = ({ createdDate, createdBy, updatedDate, updatedBy, className }: AuditInfoProps) => {
    const { t } = useTranslation()

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return dateString || '-'

        const pad = (n: number) => n.toString().padStart(2, '0')

        const hours = pad(date.getHours())
        const minutes = pad(date.getMinutes())
        const seconds = pad(date.getSeconds())
        const day = pad(date.getDate())
        const month = pad(date.getMonth() + 1)
        const year = date.getFullYear()

        return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`
    }

    return (
        <div className={cn('grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-muted-foreground', className)}>
            <div className="flex flex-col gap-1">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                    {t('common.audit.createdDate')}
                </span>
                <span>{formatDate(createdDate)}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold uppercase tracking-wider opacity-70">{t('common.audit.createdBy')}</span>
                <span>{createdBy || '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                    {t('common.audit.updatedDate')}
                </span>
                <span>{formatDate(updatedDate)}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold uppercase tracking-wider opacity-70">{t('common.audit.updatedBy')}</span>
                <span>{updatedBy || '-'}</span>
            </div>
        </div>
    )
}
