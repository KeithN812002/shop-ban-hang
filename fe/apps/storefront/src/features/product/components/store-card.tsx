import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, MessageCircle, Plus, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRequireLogin } from '@/components/auth/require-auth'
import { Button, buttonClass } from '@/components/ui/button'
import { SmartImage } from '@/components/ui/smart-image'
import { useToggleFollow } from '@/features/account/queries'
import { useStartChat } from '@/features/chat/queries'
import { formatCompact } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { StoreResponse } from '@/types/shop'

/** Store summary with follow / chat / visit actions (product page + store page). */
export function StoreCard({ store, showVisit = true }: { store: StoreResponse; showVisit?: boolean }) {
    const { t } = useTranslation()
    const requireLogin = useRequireLogin()
    const follow = useToggleFollow()
    const startChat = useStartChat()
    // The contract exposes no "am I following" flag, so the state is learned from the toggle result.
    const [followed, setFollowed] = useState<boolean | null>(null)

    const onFollow = () => {
        if (!requireLogin()) return
        follow.mutate(store.id, {
            onSuccess: result => {
                setFollowed(result.followed)
                notify.success(t(result.followed ? 'store.followed' : 'store.unfollowed', { name: store.name }))
            },
        })
    }

    const onChat = () => {
        if (requireLogin()) startChat.mutate(store.id)
    }

    return (
        <section aria-label={t('store.info')} className="flex flex-col gap-4 rounded-xl bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <SmartImage src={store.logoUrl} alt={store.name} className="size-16 shrink-0 rounded-full border object-cover" />
                <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-900">{store.name}</h2>
                    {store.province && <p className="text-xs text-gray-500">{store.province}</p>}
                    <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                        <div className="flex gap-1">
                            <dt>{t('store.rating')}:</dt>
                            <dd className="font-medium text-brand-600">
                                {store.ratingAvg.toFixed(1)} ({formatCompact(store.ratingCount)})
                            </dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>{t('store.products')}:</dt>
                            <dd className="font-medium text-brand-600">{formatCompact(store.productCount)}</dd>
                        </div>
                        <div className="flex gap-1">
                            <dt>{t('store.followers')}:</dt>
                            <dd className="font-medium text-brand-600">{formatCompact(store.followerCount)}</dd>
                        </div>
                    </dl>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={followed ? 'outline' : 'soft'}
                    size="sm"
                    loading={follow.isPending}
                    icon={followed ? <Check /> : <Plus />}
                    onClick={onFollow}
                >
                    {followed ? t('store.following') : t('store.follow')}
                </Button>
                <Button variant="outline" size="sm" loading={startChat.isPending} icon={<MessageCircle />} onClick={onChat}>
                    {t('store.chat')}
                </Button>
                {showVisit && (
                    <Link
                        to="/store/$id"
                        params={{ id: store.id }}
                        className={buttonClass({ variant: 'outline', size: 'sm' })}
                    >
                        <Store aria-hidden />
                        {t('store.visit')}
                    </Link>
                )}
            </div>
        </section>
    )
}
