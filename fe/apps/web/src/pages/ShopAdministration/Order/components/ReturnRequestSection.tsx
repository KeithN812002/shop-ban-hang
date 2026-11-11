import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailList } from '../../components/DetailList'
import { StatusBadge } from '../../components/StatusBadge'
import { formatDateTime, formatVnd, resolveMediaUrl } from '../../utils/format'
import type { ReturnRequestResponse } from '../../types'

type FieldKey =
    | 'requestStatus'
    | 'refundAmount'
    | 'reason'
    | 'requestedAt'
    | 'description'
    | 'photos'
    | 'bankName'
    | 'bankAccountNo'
    | 'bankAccountName'
    | 'sellerNote'
    | 'disputeReason'
    | 'disputedAt'
    | 'adminNote'
    | 'refundedAt'
    | 'refundNote'
    | 'refundProof'

interface ReturnRequestSectionProps {
    request: ReturnRequestResponse
}

const ImageLinks = ({ urls, alt }: { urls: string[]; alt: string }) => (
    <ul className="flex flex-wrap gap-2">
        {urls.map(url => {
            const src = resolveMediaUrl(url)
            return (
                <li key={url}>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                        <img src={src} alt={alt} className="size-20 rounded border object-cover" loading="lazy" />
                    </a>
                </li>
            )
        })}
    </ul>
)

/** Buyer return request of an order: reason, evidence, bank info and the seller / dispute / admin answers. */
export const ReturnRequestSection = memo(({ request }: ReturnRequestSectionProps) => {
    const { t } = useTranslation()
    const f = (key: FieldKey) => t(`shopAdmin.order.return.fields.${key}`)

    return (
        <DetailList
            items={[
                { label: f('requestStatus'), value: <StatusBadge domain="returnRequest" status={request.status} /> },
                { label: f('refundAmount'), value: formatVnd(request.refundAmount) },
                {
                    label: f('reason'),
                    value: t(`shopAdmin.order.return.reason.${request.reasonCode}`, {
                        defaultValue: request.reasonCode,
                    }),
                },
                { label: f('requestedAt'), value: formatDateTime(request.requestedAt) },
                { label: f('description'), value: request.description, wide: true },
                {
                    label: f('photos'),
                    value:
                        request.imageUrls.length > 0 ? (
                            <ImageLinks urls={request.imageUrls} alt={f('photos')} />
                        ) : undefined,
                    wide: true,
                },
                { label: f('bankName'), value: request.bankName },
                { label: f('bankAccountNo'), value: request.bankAccountNo },
                { label: f('bankAccountName'), value: request.bankAccountName },
                { label: f('sellerNote'), value: request.sellerNote, wide: true },
                { label: f('disputeReason'), value: request.disputeReason, wide: true },
                { label: f('disputedAt'), value: formatDateTime(request.disputedAt) },
                { label: f('adminNote'), value: request.adminNote, wide: true },
                { label: f('refundedAt'), value: formatDateTime(request.refundedAt) },
                { label: f('refundNote'), value: request.refundNote, wide: true },
                {
                    label: f('refundProof'),
                    value: request.refundProofUrl ? (
                        <a href={resolveMediaUrl(request.refundProofUrl)} target="_blank" rel="noopener noreferrer">
                            <img
                                src={resolveMediaUrl(request.refundProofUrl)}
                                alt={f('refundProof')}
                                className="max-h-40 rounded border object-contain"
                                loading="lazy"
                            />
                        </a>
                    ) : undefined,
                    wide: true,
                },
            ]}
        />
    )
})

ReturnRequestSection.displayName = 'ReturnRequestSection'
