import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

export function Logo({ className, light }: { className?: string; light?: boolean }) {
    const { t } = useTranslation()
    return (
        <Link to="/" className={cn('flex items-center gap-2', className)} aria-label={t('app.name')}>
            <span
                className={cn(
                    'flex size-9 items-center justify-center rounded-lg',
                    light ? 'bg-white text-brand-500' : 'bg-brand-500 text-white',
                )}
            >
                <ShoppingBag className="size-5" aria-hidden />
            </span>
            <span className={cn('text-xl font-bold tracking-tight', light ? 'text-white' : 'text-brand-600')}>
                {t('app.name')}
            </span>
        </Link>
    )
}
