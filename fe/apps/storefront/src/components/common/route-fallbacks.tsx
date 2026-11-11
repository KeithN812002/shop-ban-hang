import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'

export function RouteNotFound() {
    const { t } = useTranslation()
    return (
        <div className="container-page py-10">
            <EmptyState
                kind="no-match"
                title={t('common.notFound.title')}
                description={t('common.notFound.description')}
                action={
                    <Link to="/" className={buttonClass()}>
                        {t('common.backHome')}
                    </Link>
                }
            />
        </div>
    )
}

export function RouteError({ reset }: ErrorComponentProps) {
    const { t } = useTranslation()
    return (
        <div className="container-page py-10">
            <EmptyState
                kind="error"
                description={t('common.genericError')}
                action={
                    <button type="button" onClick={reset} className={buttonClass({ variant: 'outline' })}>
                        {t('common.retry')}
                    </button>
                }
            />
        </div>
    )
}
