import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { TabBar } from '@/components/ui/tab-bar'
import { formatDateTime, formatNumber } from '@/lib/format'
import { notify } from '@/lib/notify'
import { useConfirm } from '../components/confirm-dialog'
import { PromotionModal } from '../components/promotion-modal'
import { SellerShell } from '../components/seller-shell'
import { PAGE_SIZE } from '../constants'
import { useDeletePromotion, useSellerPromotions } from '../queries'
import type { PromotionState, SellerPromotion } from '../types'

type Tab = PromotionState | 'ALL'

const TABS: Tab[] = ['ALL', 'UPCOMING', 'RUNNING', 'ENDED', 'INACTIVE']

const stateTone: Record<PromotionState, string> = {
    UPCOMING: 'bg-sky-50 text-sky-700',
    RUNNING: 'bg-emerald-50 text-emerald-700',
    ENDED: 'bg-gray-100 text-gray-600',
    INACTIVE: 'bg-amber-50 text-amber-700',
}

export function PromotionsPage() {
    const { t, i18n } = useTranslation()
    const { ask, dialog } = useConfirm()
    const [tab, setTab] = useState<Tab>('ALL')
    const [page, setPage] = useState(1)
    const [editing, setEditing] = useState<SellerPromotion | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const query = useSellerPromotions({
        state: tab === 'ALL' ? undefined : tab,
        pageNumber: page,
        pageSize: PAGE_SIZE,
    })
    const remove = useDeletePromotion()
    const items = query.data?.items ?? []

    const openModal = (promotion: SellerPromotion | null) => {
        setEditing(promotion)
        setModalOpen(true)
    }

    const handleDelete = async (promotion: SellerPromotion) => {
        const result = await ask({
            title: t('seller.promotions.deleteTitle'),
            message: t('seller.promotions.deleteMessage', { name: promotion.name }),
            confirmLabel: t('seller.common.delete'),
            destructive: true,
        })
        if (!result) return
        remove.mutate(promotion.id, { onSuccess: () => notify.success(t('seller.promotions.deleted')) })
    }

    return (
        <SellerShell
            title={t('seller.promotions.title')}
            actions={
                <Button icon={<Plus />} onClick={() => openModal(null)}>
                    {t('seller.promotions.add')}
                </Button>
            }
        >
            <div className="rounded-xl border bg-white">
                <TabBar<Tab>
                    ariaLabel={t('seller.promotions.stateTabs')}
                    value={tab}
                    onChange={value => {
                        setTab(value)
                        setPage(1)
                    }}
                    tabs={TABS.map(value => ({
                        value,
                        label: value === 'ALL' ? t('seller.common.all') : t(`seller.promotions.states.${value}`),
                    }))}
                />
            </div>

            {query.isLoading && (
                <div className="space-y-2">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}
            {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
            {query.data && items.length === 0 && (
                <div className="rounded-xl border bg-white">
                    <EmptyState
                        title={t('seller.promotions.empty')}
                        description={t('seller.promotions.emptyHint')}
                        action={
                            <Button onClick={() => openModal(null)} icon={<Plus />}>
                                {t('seller.promotions.add')}
                            </Button>
                        }
                    />
                </div>
            )}

            {items.length > 0 && (
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-3 py-2">{t('seller.promotions.col.name')}</th>
                                <th className="px-3 py-2">{t('seller.promotions.col.discount')}</th>
                                <th className="px-3 py-2">{t('seller.promotions.col.period')}</th>
                                <th className="px-3 py-2 text-right">{t('seller.promotions.col.products')}</th>
                                <th className="px-3 py-2">{t('seller.promotions.col.state')}</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map(promotion => (
                                <tr key={promotion.id} className="align-middle">
                                    <td className="px-3 py-2 font-medium text-gray-900">{promotion.name}</td>
                                    <td className="px-3 py-2 font-semibold text-brand-600">-{promotion.discountPercent}%</td>
                                    <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-600">
                                        <p>{formatDateTime(promotion.startAt, i18n.language)}</p>
                                        <p>{formatDateTime(promotion.endAt, i18n.language)}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right">{formatNumber(promotion.productCount)}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                                                stateTone[promotion.state] ?? stateTone.INACTIVE,
                                            )}
                                        >
                                            {t(`seller.promotions.states.${promotion.state}`, { defaultValue: promotion.state })}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('seller.common.edit')}
                                                onClick={() => openModal(promotion)}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('seller.common.delete')}
                                                disabled={remove.isPending}
                                                onClick={() => void handleDelete(promotion)}
                                            >
                                                <Trash2 className="text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} />
            <PromotionModal open={modalOpen} promotion={editing} onClose={() => setModalOpen(false)} />
            {dialog}
        </SellerShell>
    )
}
