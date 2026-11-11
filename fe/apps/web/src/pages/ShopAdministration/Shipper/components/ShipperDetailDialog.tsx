import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { useDialogTitle } from '@/hooks'
import { DetailList } from '../../components/DetailList'
import { ModerationFooter } from '../../components/ModerationFooter'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/format'
import type { ShipperResponse } from '../../types'

interface ShipperDetailDialogProps {
    isOpen: boolean
    shipper?: ShipperResponse
    onClose: () => void
    onAction: (actionId: string, shipper: ShipperResponse) => void
}

const preventSubmit = async (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault()
}

export const ShipperDetailDialog = memo(({ isOpen, shipper, onClose, onAction }: ShipperDetailDialogProps) => {
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
            className="max-w-2xl"
            footer={shipper && <ModerationFooter row={shipper} onAction={onAction} />}
        >
            {shipper && (
                <DetailList
                    items={[
                        { label: t('shopAdmin.shipper.fields.fullName'), value: shipper.fullName },
                        { label: t('shopAdmin.shipper.fields.username'), value: shipper.username },
                        {
                            label: t('common.status'),
                            value: <StatusBadge domain="entity" status={shipper.status} />,
                        },
                        { label: t('shopAdmin.shipper.fields.phone'), value: shipper.phone },
                        { label: t('shopAdmin.shipper.fields.idNumber'), value: shipper.idNumber },
                        { label: t('shopAdmin.shipper.fields.vehicleType'), value: shipper.vehicleType },
                        { label: t('shopAdmin.shipper.fields.vehiclePlate'), value: shipper.vehiclePlate },
                        { label: t('shopAdmin.shipper.fields.areaProvince'), value: shipper.areaProvince },
                        { label: t('common.audit.createdDate'), value: formatDateTime(shipper.createdDate) },
                        { label: t('shopAdmin.reason.rejectReason'), value: shipper.rejectReason, wide: true },
                    ]}
                />
            )}
        </FormDialogContent>
    )
})

ShipperDetailDialog.displayName = 'ShipperDetailDialog'
