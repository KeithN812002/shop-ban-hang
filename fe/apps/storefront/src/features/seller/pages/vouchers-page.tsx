import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { Pagination } from '@/components/ui/pagination'
import { TabBar } from '@/components/ui/tab-bar'
import { formatDateTime, formatNumber, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import { useConfirm } from '../components/confirm-dialog'
import { SellerShell } from '../components/seller-shell'
import { VoucherModal } from '../components/voucher-modal'
import { PAGE_SIZE } from '../constants'
import { useDeleteVoucher, useSellerVouchers } from '../queries'
import type { SellerVoucher } from '../types'

type Tab = 'ALL' | 'ACTIVE' | 'INACTIVE'

const discountLabel = (voucher: SellerVoucher): string =>
    voucher.discountType === 'PERCENT' ? `${voucher.discountValue}%` : formatPrice(voucher.discountValue)

export function VouchersPage() {
    const { t } = useTranslation()
    const { ask, dialog } = useConfirm()
    const [tab, setTab] = useState<Tab>('ALL')
    const [page, setPage] = useState(1)
    const [editing, setEditing] = useState<SellerVoucher | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const query = useSellerVouchers({
        status: tab === 'ALL' ? undefined : tab,
        pageNumber: page,
        pageSize: PAGE_SIZE,
    })
    const remove = useDeleteVoucher()
    const items = query.data?.items ?? []

    const openModal = (voucher: SellerVoucher | null) => {
        setEditing(voucher)
        setModalOpen(true)
    }

    const handleDelete = async (voucher: SellerVoucher) => {
        const result = await ask({
            title: t('seller.vouchers.deleteTitle'),
            message: t('seller.vouchers.deleteMessage', { code: voucher.code }),
            confirmLabel: t('seller.common.delete'),
            destructive: true,
        })
        if (!result) return
        remove.mutate(voucher.id, { onSuccess: () => notify.success(t('seller.vouchers.deleted')) })
    }

    return (
        <SellerShell
            title={t('seller.vouchers.title')}
            actions={
                <Button icon={<Plus />} onClick={() => openModal(null)}>
                    {t('seller.vouchers.add')}
                </Button>
            }
        >
            <div className="rounded-xl border bg-white">
                <TabBar<Tab>
                    ariaLabel={t('seller.vouchers.statusTabs')}
                    value={tab}
                    onChange={value => {
                        setTab(value)
                        setPage(1)
                    }}
                    tabs={[
                        { value: 'ALL', label: t('seller.common.all') },
                        { value: 'ACTIVE', label: t('seller.vouchers.statuses.ACTIVE') },
                        { value: 'INACTIVE', label: t('seller.vouchers.statuses.INACTIVE') },
                    ]}
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
                        title={t('seller.vouchers.empty')}
                        action={
                            <Button onClick={() => openModal(null)} icon={<Plus />}>
                                {t('seller.vouchers.add')}
                            </Button>
                        }
                    />
                </div>
            )}

            {items.length > 0 && (
                <div className="overflow-x-auto rounded-xl border bg-white">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-3 py-2">{t('seller.vouchers.code')}</th>
                                <th className="px-3 py-2">{t('seller.vouchers.col.discount')}</th>
                                <th className="px-3 py-2">{t('seller.vouchers.col.period')}</th>
                                <th className="px-3 py-2 text-right">{t('seller.vouchers.col.usage')}</th>
                                <th className="px-3 py-2">{t('seller.vouchers.status')}</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map(voucher => (
                                <tr key={voucher.id} className="align-middle">
                                    <td className="px-3 py-2">
                                        <p className="font-mono font-semibold text-gray-900">{voucher.code}</p>
                                        <p className="text-xs text-gray-500">{voucher.name}</p>
                                    </td>
                                    <td className="px-3 py-2">
                                        <p className="font-semibold text-brand-600">{discountLabel(voucher)}</p>
                                        <p className="text-xs text-gray-500">
                                            {voucher.discountType === 'PERCENT' && voucher.maxDiscount
                                                ? t('seller.vouchers.upTo', { value: formatPrice(voucher.maxDiscount) })
                                                : null}
                                            {voucher.minOrderValue
                                                ? ` ${t('seller.vouchers.minOrderShort', { value: formatPrice(voucher.minOrderValue) })}`
                                                : null}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-600">
                                        <p>{formatDateTime(voucher.startAt)}</p>
                                        <p>{formatDateTime(voucher.endAt)}</p>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {formatNumber(voucher.usedCount ?? 0)}/
                                        {voucher.usageLimit ? formatNumber(voucher.usageLimit) : '∞'}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={
                                                voucher.status === 'ACTIVE'
                                                    ? 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700'
                                                    : 'rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600'
                                            }
                                        >
                                            {t(`seller.vouchers.statuses.${voucher.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('seller.common.edit')}
                                                onClick={() => openModal(voucher)}
                                            >
                                                <Pencil />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('seller.common.delete')}
                                                onClick={() => void handleDelete(voucher)}
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
            <VoucherModal open={modalOpen} voucher={editing} onClose={() => setModalOpen(false)} />
            {dialog}
        </SellerShell>
    )
}
