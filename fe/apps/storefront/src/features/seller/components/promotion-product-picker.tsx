import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form-controls'
import { Pagination } from '@/components/ui/pagination'
import { SmartImage } from '@/components/ui/smart-image'
import { useDebounce } from '@/hooks/use-debounce'
import { formatPrice } from '@/lib/format'
import type { Uuid } from '@/types/api'
import { isValidPercent, previewPrice } from '../lib/promotion-schema'
import { useSellerProducts } from '../queries'
import { MAX_PROMOTION_PRODUCTS, type PromotionProduct } from '../types'

const PICKER_PAGE_SIZE = 6

interface PromotionProductPickerProps {
    selected: PromotionProduct[]
    onChange: (next: PromotionProduct[]) => void
    /** Drives the "price -> effective price" preview; ignored while outside 1-90. */
    percent: number
    error?: string
}

function PriceLine({ price, percent }: { price: number; percent: number }) {
    if (!isValidPercent(percent)) return <span className="text-gray-600">{formatPrice(price)}</span>
    return (
        <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-gray-400 line-through">{formatPrice(price)}</span>
            <span className="font-semibold text-brand-600">{formatPrice(previewPrice(price, percent))}</span>
        </span>
    )
}

/** Searches the seller's own products and keeps a multi-selection with thumbnails and the discounted-price preview. */
export function PromotionProductPicker({ selected, onChange, percent, error }: PromotionProductPickerProps) {
    const { t } = useTranslation()
    const [keywordInput, setKeywordInput] = useState('')
    const [page, setPage] = useState(1)
    const keyword = useDebounce(keywordInput.trim(), 350)
    const query = useSellerProducts({ keyword: keyword || undefined, pageNumber: page, pageSize: PICKER_PAGE_SIZE })
    const rows = query.data?.items ?? []
    const selectedIds = new Set<Uuid>(selected.map(product => product.id))
    const limitReached = selected.length >= MAX_PROMOTION_PRODUCTS

    const toggle = (product: PromotionProduct) => {
        if (selectedIds.has(product.id)) onChange(selected.filter(item => item.id !== product.id))
        else if (!limitReached) onChange([...selected, product])
    }

    return (
        <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">
                    {t('seller.promotions.products')}
                    <span className="ml-0.5 text-red-500">*</span>
                </span>
                <span className="text-xs text-gray-500">
                    {t('seller.promotions.selectedCount', { count: selected.length, max: MAX_PROMOTION_PRODUCTS })}
                </span>
            </div>

            <div className="rounded-lg border">
                <div className="relative border-b p-2">
                    <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
                    <Input
                        className="pl-9"
                        value={keywordInput}
                        placeholder={t('seller.promotions.searchProducts')}
                        aria-label={t('seller.promotions.searchProducts')}
                        // The picker lives inside the promotion form: Enter must search, not submit.
                        onKeyDown={event => event.key === 'Enter' && event.preventDefault()}
                        onChange={event => {
                            setKeywordInput(event.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                {query.isLoading && (
                    <div className="flex justify-center p-4">
                        <Spinner />
                    </div>
                )}
                {query.isError && <p className="p-3 text-sm text-red-600">{t('seller.promotions.searchFailed')}</p>}
                {query.data && rows.length === 0 && (
                    <p className="p-3 text-sm text-gray-500">{t('seller.promotions.noProducts')}</p>
                )}
                <ul className="divide-y">
                    {rows.map(row => {
                        const checked = selectedIds.has(row.id)
                        return (
                            <li key={row.id}>
                                <label
                                    className={cn(
                                        'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50',
                                        !checked && limitReached && 'cursor-not-allowed opacity-50',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        className="size-4 accent-brand-500"
                                        checked={checked}
                                        disabled={!checked && limitReached}
                                        onChange={() =>
                                            toggle({
                                                id: row.id,
                                                name: row.name,
                                                thumbnailUrl: row.thumbnailUrl,
                                                price: row.price,
                                                stock: row.stock,
                                                status: row.status,
                                            })
                                        }
                                    />
                                    <SmartImage
                                        src={row.thumbnailUrl}
                                        alt={row.name}
                                        className="size-10 shrink-0 rounded-md border object-cover"
                                    />
                                    <span className="line-clamp-2 min-w-0 flex-1 text-gray-800">{row.name}</span>
                                    <span className="shrink-0 text-right text-xs">
                                        <PriceLine price={row.price} percent={percent} />
                                    </span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
                <Pagination page={page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} className="p-2" />
            </div>

            {selected.length > 0 && (
                <ul className="max-h-56 divide-y overflow-y-auto rounded-lg border bg-gray-50" aria-label={t('seller.promotions.selected')}>
                    {selected.map(product => (
                        <li key={product.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                            <SmartImage
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="size-10 shrink-0 rounded-md border object-cover"
                            />
                            <span className="line-clamp-2 min-w-0 flex-1 text-gray-800">{product.name}</span>
                            <span className="shrink-0 text-right text-xs">
                                <PriceLine price={product.price} percent={percent} />
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('seller.common.remove')}
                                onClick={() => onChange(selected.filter(item => item.id !== product.id))}
                            >
                                <X />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            {error && (
                <p role="alert" className="text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}
