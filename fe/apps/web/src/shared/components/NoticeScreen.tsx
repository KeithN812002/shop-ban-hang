import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NoticeScreenProps {
    title?: string
    description?: string
    traceId?: string
}

export function NoticeScreen({ title, description, traceId }: NoticeScreenProps) {
    const { t } = useTranslation()

    return (
        <div className="flex-1 flex items-center justify-center min-h-0 py-10 px-4">
            <div className="w-full max-w-md flex flex-col items-center text-center bg-card border border-border rounded-2xl shadow-sm px-8 py-12">
                <div className="size-20 flex items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
                    <ShieldAlert className="size-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {title ?? t('dynamicRoute.accessDenied.title')}
                </h1>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                    {description ?? t('dynamicRoute.accessDenied.description')}
                </p>
                {traceId && <span className="mt-3 text-xs text-muted-foreground/60">Trace ID: {traceId}</span>}
            </div>
        </div>
    )
}
