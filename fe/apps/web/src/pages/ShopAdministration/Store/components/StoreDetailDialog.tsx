import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { useDialogTitle } from '@/hooks'
import { DetailList } from '../../components/DetailList'
import { ModerationFooter } from '../../components/ModerationFooter'
import { StatusBadge } from '../../components/StatusBadge'
import { formatCount, formatDateTime, resolveMediaUrl } from '../../utils/format'
import type { StoreResponse } from '../../types'

interface StoreDetailDialogProps {
    isOpen: boolean
    isLoading?: boolean
    store?: StoreResponse
    onClose: () => void
    onAction: (actionId: string, store: StoreResponse) => void
}

const preventSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault()
}

export const StoreDetailDialog = memo(({ isOpen, isLoading, store, onClose, onAction }: StoreDetailDialogProps) => {
    const { t } = useTranslation()
    const dialogTitle = useDialogTitle()
    const banner = resolveMediaUrl(store?.bannerUrl)

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={onClose}
            onSave={preventSubmit}
            title={dialogTitle('view')}
            t={t}
            columns={1}
            className="max-w-3xl"
            footer={store && <ModerationFooter row={store} onAction={onAction} />}
        >
            <LoadingOverlay isLoading={!!isLoading} text={t('common.loading')}>
                {store ? (
                    <div className="space-y-4">
                        {banner && <img src={banner} alt="" className="h-32 w-full rounded-md object-cover" />}
                        <DetailList
                            items={[
                                { label: t('shopAdmin.store.fields.name'), value: store.name },
                                {
                                    label: t('common.status'),
                                    value: <StatusBadge domain="entity" status={store.status} />,
                                },
                                { label: t('shopAdmin.store.fields.owner'), value: store.ownerUsername },
                                { label: t('shopAdmin.store.fields.phone'), value: store.phone },
                                { label: t('shopAdmin.store.fields.province'), value: store.province },
                                { label: t('shopAdmin.store.fields.address'), value: store.address },
                                {
                                    label: t('shopAdmin.store.fields.productCount'),
                                    value: formatCount(store.productCount),
                                },
                                {
                                    label: t('shopAdmin.store.fields.followerCount'),
                                    value: formatCount(store.followerCount),
                                },
                                {
                                    label: t('shopAdmin.store.fields.rating'),
                                    value:
                                        store.ratingAvg != null
                                            ? `${store.ratingAvg.toFixed(1)} (${formatCount(store.ratingCount ?? 0)})`
                                            : undefined,
                                },
                                { label: t('common.audit.createdDate'), value: formatDateTime(store.createdDate) },
                                {
                                    label: t('shopAdmin.store.fields.description'),
                                    value: store.description,
                                    wide: true,
                                },
                                {
                                    label: t('shopAdmin.reason.rejectReason'),
                                    value: store.rejectReason,
                                    wide: true,
                                },
                            ]}
                        />
                    </div>
                ) : (
                    !isLoading && <EmptyState kind="no-records" variant="compact" />
                )}
            </LoadingOverlay>
        </FormDialogContent>
    )
})

StoreDetailDialog.displayName = 'StoreDetailDialog'
