import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SmartImage } from '@/components/ui/smart-image'
import { formatDateTime, formatPrice } from '@/lib/format'
import { notify } from '@/lib/notify'
import type { ReturnRequestResponse } from '@/types/shop'

interface ReturnRequestDetailsProps {
    request: ReturnRequestResponse
    /** Seller view: show a copy button next to the bank fields so the transfer can be made quickly. */
    copyable?: boolean
}

function CopyValue({ value, copyable, mono }: { value: string | null; copyable?: boolean; mono?: boolean }) {
    const { t } = useTranslation()
    if (!value) return <span>—</span>
    const copy = () => {
        navigator.clipboard.writeText(value).then(
            () => notify.success(t('order.return.copied')),
            () => notify.error(t('order.return.copyFailed')),
        )
    }
    return (
        <span className="inline-flex items-center gap-2">
            <span className={mono ? 'font-mono' : undefined}>{value}</span>
            {copyable && (
                <button
                    type="button"
                    onClick={copy}
                    aria-label={t('order.return.copy')}
                    title={t('order.return.copy')}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-brand-600"
                >
                    <Copy className="size-3.5" aria-hidden />
                </button>
            )}
        </span>
    )
}

/** Request body shared by buyer and seller: reason, description, evidence photos, bank info and refund amount. */
export function ReturnRequestDetails({ request, copyable = false }: ReturnRequestDetailsProps) {
    const { t, i18n } = useTranslation()
    return (
        <div className="space-y-3 text-sm">
            <dl className="space-y-1">
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">{t('order.return.reasonRow')}</dt>
                    <dd className="text-right font-medium text-gray-900">
                        {t(`order.return.reason.${request.reasonCode}`, { defaultValue: request.reasonCode })}
                    </dd>
                </div>
                {request.description && (
                    <div className="flex justify-between gap-4">
                        <dt className="shrink-0 text-gray-600">{t('order.return.descriptionRow')}</dt>
                        <dd className="text-right break-words whitespace-pre-line text-gray-800">
                            {request.description}
                        </dd>
                    </div>
                )}
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">{t('order.return.refundAmount')}</dt>
                    <dd className="text-base font-bold text-brand-600">{formatPrice(request.refundAmount)}</dd>
                </div>
                <p className="pt-1 text-xs text-gray-500">
                    {t('order.return.requestedAt', { date: formatDateTime(request.requestedAt, i18n.language) })}
                </p>
            </dl>

            {request.imageUrls.length > 0 && (
                <div>
                    <p className="mb-1 font-medium text-gray-700">{t('order.return.photos')}</p>
                    <ul className="flex flex-wrap gap-2">
                        {request.imageUrls.map(url => (
                            <li key={url}>
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                    <SmartImage
                                        src={url}
                                        alt={t('order.return.photos')}
                                        className="size-20 rounded-md border object-cover"
                                    />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div
                className={
                    copyable ? 'rounded-lg border-2 border-brand-200 bg-brand-50 p-3' : 'rounded-lg bg-gray-50 p-3'
                }
            >
                <p className="mb-1 font-semibold text-gray-800">{t('order.return.bankInfo')}</p>
                <dl className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">{t('order.return.bankName')}</dt>
                        <dd className="font-medium">
                            <CopyValue value={request.bankName} copyable={copyable} />
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">{t('order.return.accountNo')}</dt>
                        <dd className={copyable ? 'text-base font-bold' : 'font-medium'}>
                            <CopyValue value={request.bankAccountNo} copyable={copyable} mono />
                        </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                        <dt className="text-gray-600">{t('order.return.accountName')}</dt>
                        <dd className="font-medium">
                            <CopyValue value={request.bankAccountName} copyable={copyable} />
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    )
}
