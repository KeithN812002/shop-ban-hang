import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Spinner } from '@workspace/ui/components/Spinner'
import type { LoadingOverlayProps } from './LoadingOverlay.types'

export function LoadingOverlay({ children, isLoading, isFullScreen, message, text, className }: LoadingOverlayProps) {
    const { t } = useTranslation()

    return (
        <div className={cn('relative w-full h-full', className)}>
            <div
                className={cn(
                    'w-full h-full',
                    isLoading && !isFullScreen && 'opacity-40 pointer-events-none transition-opacity duration-300',
                )}
            >
                {children}
            </div>
            {isLoading && (
                <div
                    className={cn(
                        'flex flex-col items-center justify-center z-[50]',
                        isFullScreen ? 'fixed inset-0 z-[10001] bg-black/10' : 'absolute inset-0',
                    )}
                >
                    <Spinner className="size-10 mb-4" />
                    <p className="text-sm font-semibold text-primary animate-pulse tracking-wide italic">
                        {text ?? message ?? t('common.loading')}
                    </p>
                </div>
            )}
        </div>
    )
}
