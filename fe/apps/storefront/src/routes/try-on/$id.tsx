import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { buttonClass } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { useProduct } from '@/features/catalog/queries'
import { ArTryOn } from '@/features/ar-try-on/ar-try-on'

export const Route = createFileRoute('/try-on/$id')({ component: TryOnPage })

function TryOnPage() {
    const { id } = Route.useParams()
    const { t } = useTranslation()
    const product = useProduct(id)

    if (product.isLoading) {
        return (
            <div className="container-page py-6">
                <Skeleton className="mx-auto aspect-video w-full max-w-3xl" />
            </div>
        )
    }
    if (product.isError || !product.data) {
        return (
            <div className="container-page py-8">
                <ErrorState onRetry={() => void product.refetch()} />
            </div>
        )
    }

    const p = product.data
    const supported = p.arType !== 'NONE' && Boolean(p.arOverlayUrl)

    return (
        <div className="container-page space-y-4 py-4">
            <Link
                to="/product/$id"
                params={{ id: p.id }}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600"
            >
                <ArrowLeft className="size-4" aria-hidden />
                {t('ar.backToProduct')}
            </Link>
            <h1 className="text-lg font-bold text-gray-900">
                {t('ar.title')}: <span className="font-semibold text-brand-600">{p.name}</span>
            </h1>

            {supported ? (
                <ArTryOn product={p} />
            ) : (
                <div className="rounded-xl bg-white">
                    <EmptyState
                        title={t('ar.notSupportedTitle')}
                        description={t('ar.notSupported')}
                        action={
                            <Link to="/product/$id" params={{ id: p.id }} className={buttonClass()}>
                                {t('ar.backToProduct')}
                            </Link>
                        }
                    />
                </div>
            )}
        </div>
    )
}
