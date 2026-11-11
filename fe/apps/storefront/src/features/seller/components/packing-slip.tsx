import { useTranslation } from 'react-i18next'
import { formatDateTime, formatPrice } from '@/lib/format'
import type { SellerOrderDetail } from '../types'

/**
 * Print stylesheet: while a slip is mounted, everything except the slip is removed from the printed page
 * (app header/footer/chat widget are siblings of <main> in the root layout).
 */
const PRINT_CSS = `
@media print {
  header, footer, nav, #app > div > :not(main) { display: none !important; }
  body { background: #fff !important; }
  .packing-slip { display: block !important; }
}
@page { margin: 12mm; }
`

/** Hidden on screen, the only thing visible when printing (window.print). */
export function PackingSlip({ order }: { order: SellerOrderDetail }) {
    const { t } = useTranslation()
    const cod = order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID'
    return (
        <div className="packing-slip hidden text-black">
            <style>{PRINT_CSS}</style>
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
                <div>
                    <p className="text-lg font-bold">{order.storeName ?? t('seller.slip.title')}</p>
                    <p className="text-sm">{t('seller.slip.title')}</p>
                </div>
                <div className="text-right text-sm">
                    <p className="font-mono text-lg font-bold">#{order.code}</p>
                    <p>{formatDateTime(order.createdDate)}</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-6 text-sm">
                <div>
                    <p className="font-semibold uppercase">{t('seller.slip.receiver')}</p>
                    <p className="font-medium">{order.receiverName}</p>
                    <p>{order.receiverPhone}</p>
                    <p>{order.shippingAddress}</p>
                </div>
                <div>
                    <p className="font-semibold uppercase">{t('seller.slip.payment')}</p>
                    <p>{cod ? t('seller.slip.cod') : t('seller.slip.paid')}</p>
                    {cod && <p className="text-xl font-bold">{formatPrice(order.total)}</p>}
                </div>
            </div>

            <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                    <tr className="border-y border-black text-left">
                        <th className="py-1">{t('seller.slip.product')}</th>
                        <th className="py-1 text-right">{t('seller.slip.qty')}</th>
                        <th className="py-1 text-right">{t('seller.slip.price')}</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-400">
                            <td className="py-1.5">
                                {item.productName}
                                {item.variantName && <span className="text-gray-700"> ({item.variantName})</span>}
                            </td>
                            <td className="py-1.5 text-right">{item.quantity}</td>
                            <td className="py-1.5 text-right">{formatPrice(item.price)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-3 ml-auto w-64 space-y-0.5 text-sm">
                <div className="flex justify-between">
                    <span>{t('seller.slip.subtotal')}</span>
                    <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('seller.slip.shipping')}</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                    <span>{t('seller.slip.discount')}</span>
                    <span>-{formatPrice((order.storeDiscount ?? 0) + (order.platformDiscount ?? 0))}</span>
                </div>
                <div className="flex justify-between border-t border-black pt-1 text-base font-bold">
                    <span>{t('seller.slip.total')}</span>
                    <span>{formatPrice(order.total)}</span>
                </div>
            </div>

            {order.note && (
                <p className="mt-4 text-sm">
                    <span className="font-semibold">{t('seller.slip.note')}: </span>
                    {order.note}
                </p>
            )}
        </div>
    )
}
