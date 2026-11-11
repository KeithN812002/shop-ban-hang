import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Textarea } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { RatingStars } from '@/components/ui/rating-stars'
import { SmartImage } from '@/components/ui/smart-image'
import { TabBar } from '@/components/ui/tab-bar'
import { formatDateTime } from '@/lib/format'
import { splitCsv } from '@/lib/media'
import { notify } from '@/lib/notify'
import type { Uuid } from '@/types/api'
import { SellerShell } from '../components/seller-shell'
import { PAGE_SIZE } from '../constants'
import { useReplyReview, useSellerReviews } from '../queries'
import type { SellerReview } from '../types'

type RatingTab = 'ALL' | '5' | '4' | '3' | '2' | '1'
const RATING_TABS: RatingTab[] = ['ALL', '5', '4', '3', '2', '1']
const MAX_REPLY = 1000

const reviewImages = (review: SellerReview): string[] =>
    Array.isArray(review.imageUrls) ? review.imageUrls : splitCsv(review.imageUrls)

function ReplyBox({ review, onDone }: { review: SellerReview; onDone: () => void }) {
    const { t } = useTranslation()
    const [text, setText] = useState(review.sellerReply ?? '')
    const reply = useReplyReview()
    const trimmed = text.trim()

    const submit = () => {
        reply.mutate(
            { id: review.id, reply: trimmed },
            {
                onSuccess: () => {
                    notify.success(t('seller.reviews.replied'))
                    onDone()
                },
            },
        )
    }

    return (
        <div className="space-y-2">
            <Textarea
                rows={3}
                value={text}
                maxLength={MAX_REPLY}
                placeholder={t('seller.reviews.replyPlaceholder')}
                aria-label={t('seller.reviews.replyPlaceholder')}
                onChange={event => setText(event.target.value)}
            />
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onDone}>
                    {t('seller.common.cancel')}
                </Button>
                <Button size="sm" loading={reply.isPending} disabled={trimmed.length === 0} onClick={submit}>
                    {t('seller.reviews.sendReply')}
                </Button>
            </div>
        </div>
    )
}

export function ReviewsPage() {
    const { t } = useTranslation()
    const [tab, setTab] = useState<RatingTab>('ALL')
    const [page, setPage] = useState(1)
    const [replyingId, setReplyingId] = useState<Uuid | null>(null)

    const query = useSellerReviews({
        rating: tab === 'ALL' ? undefined : Number(tab),
        pageNumber: page,
        pageSize: PAGE_SIZE,
    })
    const items = query.data?.items ?? []

    return (
        <SellerShell title={t('seller.reviews.title')}>
            <div className="rounded-xl border bg-white">
                <TabBar<RatingTab>
                    ariaLabel={t('seller.reviews.ratingTabs')}
                    value={tab}
                    onChange={value => {
                        setTab(value)
                        setPage(1)
                        setReplyingId(null)
                    }}
                    tabs={RATING_TABS.map(value => ({
                        value,
                        label: value === 'ALL' ? t('seller.common.all') : t('seller.reviews.stars', { count: Number(value) }),
                    }))}
                />
            </div>

            {query.isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 3 }, (_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState kind={tab === 'ALL' ? 'empty' : 'no-match'} title={t('seller.reviews.empty')} />
                </div>
            )}

            <ul className="space-y-3">
                {items.map(review => {
                    const images = reviewImages(review)
                    const replying = replyingId === review.id
                    return (
                        <li key={review.id} className="space-y-2 rounded-xl border bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{review.buyerName}</span>
                                    <RatingStars value={review.rating} />
                                </div>
                                <span className="text-xs text-gray-500">{formatDateTime(review.createdDate)}</span>
                            </div>
                            {(review.productName || review.variantName) && (
                                <p className="text-xs text-gray-500">
                                    {[review.productName, review.variantName].filter(Boolean).join(' · ')}
                                </p>
                            )}
                            {review.comment && <p className="text-sm whitespace-pre-line text-gray-800">{review.comment}</p>}
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {images.map(url => (
                                        <SmartImage
                                            key={url}
                                            src={url}
                                            alt={t('seller.reviews.imageAlt')}
                                            className="size-16 rounded-md border object-cover"
                                        />
                                    ))}
                                </div>
                            )}

                            {replying ? (
                                <ReplyBox review={review} onDone={() => setReplyingId(null)} />
                            ) : review.sellerReply ? (
                                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                                    <p className="mb-1 text-xs font-semibold text-gray-600">{t('seller.reviews.yourReply')}</p>
                                    <p className="whitespace-pre-line text-gray-800">{review.sellerReply}</p>
                                    <button
                                        type="button"
                                        className="mt-1 text-xs text-brand-600 hover:underline"
                                        onClick={() => setReplyingId(review.id)}
                                    >
                                        {t('seller.reviews.editReply')}
                                    </button>
                                </div>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => setReplyingId(review.id)}>
                                    {t('seller.reviews.reply')}
                                </Button>
                            )}
                        </li>
                    )
                })}
            </ul>

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
        </SellerShell>
    )
}
