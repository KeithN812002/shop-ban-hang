import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Unlock } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { ActionButton } from '@/components/Common/ActionButton'
import { useDialogTitle } from '@/hooks'
import { DetailList } from '../../components/DetailList'
import { StatusBadge } from '../../components/StatusBadge'
import { formatCount, formatDateTime, formatVnd, resolveMediaUrl } from '../../utils/format'
import type { ProductDetailResponse, ProductResponse } from '../../types'

interface ProductDetailDialogProps {
    isOpen: boolean
    isLoading?: boolean
    product?: ProductDetailResponse
    onClose: () => void
    onAction: (actionId: string, product: ProductResponse) => void
}

const preventSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault()
}

const formatTags = (tags: ProductDetailResponse['tags']): string | undefined =>
    Array.isArray(tags) ? tags.join(', ') : (tags ?? undefined)

export const ProductDetailDialog = memo(
    ({ isOpen, isLoading, product, onClose, onAction }: ProductDetailDialogProps) => {
        const { t } = useTranslation()
        const dialogTitle = useDialogTitle()

        return (
            <FormDialogContent
                isOpen={isOpen}
                onClose={onClose}
                onSave={preventSubmit}
                title={dialogTitle('view')}
                t={t}
                columns={1}
                className="max-w-4xl"
                footer={
                    product && (
                        <>
                            {product.status !== 'BANNED' && (
                                <ActionButton
                                    actionCode="ban"
                                    icon={Ban}
                                    variant="destructive"
                                    label={t('shopAdmin.actions.ban')}
                                    onPress={() => onAction('ban', product)}
                                />
                            )}
                            {product.status === 'BANNED' && (
                                <ActionButton
                                    actionCode="unban"
                                    icon={Unlock}
                                    label={t('shopAdmin.actions.unban')}
                                    onPress={() => onAction('unban', product)}
                                />
                            )}
                        </>
                    )
                }
            >
                <LoadingOverlay isLoading={!!isLoading} text={t('common.loading')}>
                    {product ? (
                        <div className="space-y-4">
                            {product.images && product.images.length > 0 && (
                                <ul
                                    className="flex gap-2 overflow-x-auto scrollbar-hide"
                                    aria-label={t('shopAdmin.product.fields.images')}
                                >
                                    {product.images.map(image => (
                                        <li key={image} className="shrink-0">
                                            <img
                                                src={resolveMediaUrl(image)}
                                                alt={product.name}
                                                className="size-24 rounded-md object-cover"
                                                loading="lazy"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <DetailList
                                items={[
                                    { label: t('shopAdmin.product.fields.name'), value: product.name },
                                    {
                                        label: t('common.status'),
                                        value: <StatusBadge domain="product" status={product.status} />,
                                    },
                                    { label: t('shopAdmin.product.fields.store'), value: product.storeName },
                                    { label: t('shopAdmin.product.fields.category'), value: product.categoryName },
                                    { label: t('shopAdmin.product.fields.price'), value: formatVnd(product.price) },
                                    {
                                        label: t('shopAdmin.product.fields.originalPrice'),
                                        value: formatVnd(product.originalPrice),
                                    },
                                    { label: t('shopAdmin.product.fields.stock'), value: formatCount(product.stock) },
                                    {
                                        label: t('shopAdmin.product.fields.soldCount'),
                                        value: formatCount(product.soldCount),
                                    },
                                    {
                                        label: t('shopAdmin.product.fields.viewCount'),
                                        value: formatCount(product.viewCount),
                                    },
                                    {
                                        label: t('shopAdmin.product.fields.rating'),
                                        value:
                                            product.ratingAvg != null
                                                ? `${product.ratingAvg.toFixed(1)} (${formatCount(product.ratingCount ?? 0)})`
                                                : undefined,
                                    },
                                    { label: t('shopAdmin.product.fields.arType'), value: product.arType },
                                    {
                                        label: t('common.audit.createdDate'),
                                        value: formatDateTime(product.createdDate),
                                    },
                                    {
                                        label: t('shopAdmin.product.fields.tags'),
                                        value: formatTags(product.tags),
                                        wide: true,
                                    },
                                    {
                                        label: t('shopAdmin.product.fields.description'),
                                        value: product.description && (
                                            <span className="whitespace-pre-line">{product.description}</span>
                                        ),
                                        wide: true,
                                    },
                                    { label: t('shopAdmin.reason.banReason'), value: product.banReason, wide: true },
                                ]}
                            />
                            {product.variants && product.variants.length > 0 && (
                                <section>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {t('shopAdmin.product.fields.variants')}
                                    </h3>
                                    <ul className="divide-y rounded-md border text-sm">
                                        {product.variants.map(variant => (
                                            <li
                                                key={variant.id}
                                                className="flex items-center justify-between gap-4 px-3 py-2"
                                            >
                                                <span className="font-medium">{variant.name}</span>
                                                <span className="text-muted-foreground">
                                                    {formatVnd(variant.price)} &middot;{' '}
                                                    {t('shopAdmin.product.fields.stock')}: {formatCount(variant.stock)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>
                    ) : (
                        !isLoading && <EmptyState kind="no-records" variant="compact" />
                    )}
                </LoadingOverlay>
            </FormDialogContent>
        )
    },
)

ProductDetailDialog.displayName = 'ProductDetailDialog'
