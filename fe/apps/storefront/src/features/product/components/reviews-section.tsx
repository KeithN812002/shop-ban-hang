import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { RatingStars } from '@/components/ui/rating-stars'
import { SmartImage } from '@/components/ui/smart-image'
import { useProductReviews, useReviewSummary } from '@/features/catalog/queries'
import { formatDateTime } from '@/lib/format'
import { resolveMediaUrl, splitCsv } from '@/lib/media'
import type { Uuid } from '@/types/api'

const PAGE_SIZE = 10

export const toImageList = (value: string[] | string | null | undefined): string[] =>
    Array.isArray(value) ? value : splitCsv(value)

export function ReviewsSection({ productId }: { productId: Uuid }) {
    const { t, i18n } = useTranslation()
    const [rating, setRating] = useState<number | undefined>()
    const [page, setPage] = useState(1)
    const summary = useReviewSummary(productId)
    const reviews = useProductReviews(productId, { rating, pageNumber: page, pageSize: PAGE_SIZE })

    const total = summary.data?.total ?? 0
    const filters: Array<{ value: number | undefined; label: string }> = [
        { value: undefined, label: t('review.all', { count: total }) },
        ...[5, 4, 3, 2, 1].map(star => ({
            value: star,
            label: t('review.stars', { count: star, total: summary.data?.counts?.[String(star)] ?? 0 }),
        })),
    ]

    return (
        <section aria-label={t('review.title')} className="rounded-xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 uppercase">{t('review.title')}</h2>

            {summary.isLoading ? (
                <Skeleton className="h-24 w-full" />
            ) : (
                <div className="flex flex-col gap-4 rounded-lg bg-brand-50/50 p-4 sm:flex-row sm:items-center">
                    <div className="text-center sm:w-40">
                        <p className="text-4xl font-bold text-brand-600">
                            {(summary.data?.average ?? 0).toFixed(1)}
                            <span className="text-lg text-gray-500"> / 5</span>
                        </p>
                        <RatingStars value={summary.data?.average ?? 0} size={18} className="mt-1" />
                        <p className="mt-1 text-xs text-gray-500">{t('review.count', { count: total })}</p>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2" role="group" aria-label={t('review.filter')}>
                        {filters.map(filter => (
                            <button
                                key={filter.label}
                                type="button"
                                aria-pressed={rating === filter.value}
                                onClick={() => {
                                    setRating(filter.value)
                                    setPage(1)
                                }}
                                className={cn(
                                    'rounded-md border px-3 py-1.5 text-sm',
                                    rating === filter.value
                                        ? 'border-brand-500 bg-white font-semibold text-brand-600'
                                        : 'bg-white hover:border-brand-400',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-2 divide-y">
                {reviews.isLoading &&
                    Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="my-4 h-20 w-full" />)}
                {reviews.isError && <ErrorState onRetry={() => void reviews.refetch()} />}
                {reviews.data?.items.length === 0 && <EmptyState title={t('review.empty')} />}
                {reviews.data?.items.map(review => (
                    <article key={review.id} className="flex gap-3 py-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                            {review.buyerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="text-sm font-medium text-gray-900">{review.buyerName}</p>
                            <RatingStars value={review.rating} size={13} />
                            <p className="text-xs text-gray-400">
                                {formatDateTime(review.createdDate, i18n.language)}
                                {review.variantName && ` | ${t('review.variant')}: ${review.variantName}`}
                            </p>
                            {review.comment && <p className="text-sm whitespace-pre-line text-gray-800">{review.comment}</p>}
                            {toImageList(review.imageUrls).length > 0 && (
                                <ul className="flex flex-wrap gap-2">
                                    {toImageList(review.imageUrls).map(url => (
                                        <li key={url}>
                                            <a href={resolveMediaUrl(url)} target="_blank" rel="noreferrer">
                                                <SmartImage
                                                    src={url}
                                                    alt={t('review.photo')}
                                                    className="size-16 rounded-md border object-cover"
                                                />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {review.sellerReply && (
                                <div className="rounded-md bg-gray-50 p-3 text-sm">
                                    <p className="font-medium text-gray-700">{t('review.sellerReply')}</p>
                                    <p className="whitespace-pre-line text-gray-600">{review.sellerReply}</p>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            {reviews.data && (
                <Pagination page={page} totalPages={reviews.data.totalPages} onChange={setPage} className="pt-2" />
            )}
        </section>
    )
}
