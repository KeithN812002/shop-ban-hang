import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import type { ProductSort } from '@/types/shop'

interface SortTabsProps {
    value: ProductSort
    onChange: (sort: ProductSort) => void
}

const BASIC: ProductSort[] = ['relevance', 'newest', 'best_selling']

/** Shopee-style sort bar: Relevance | Newest | Best selling | Price (asc/desc dropdown). */
export function SortTabs({ value, onChange }: SortTabsProps) {
    const { t } = useTranslation()
    const isPrice = value === 'price_asc' || value === 'price_desc'
    const tab = 'rounded-md px-3 py-2 text-sm transition-colors'
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-2" role="group" aria-label={t('search.sortBy')}>
            <span className="hidden text-sm text-gray-600 sm:inline">{t('search.sortBy')}</span>
            {BASIC.map(sort => (
                <button
                    key={sort}
                    type="button"
                    aria-pressed={value === sort}
                    onClick={() => onChange(sort)}
                    className={cn(tab, value === sort ? 'bg-brand-500 text-white' : 'bg-white hover:text-brand-600')}
                >
                    {t(`search.sort.${sort}`)}
                </button>
            ))}
            <select
                aria-label={t('search.sort.price')}
                value={isPrice ? value : ''}
                onChange={event => event.target.value && onChange(event.target.value as ProductSort)}
                className={cn(tab, 'border-0', isPrice ? 'bg-brand-500 text-white' : 'bg-white')}
            >
                <option value="" disabled>
                    {t('search.sort.price')}
                </option>
                <option value="price_asc">{t('search.sort.price_asc')}</option>
                <option value="price_desc">{t('search.sort.price_desc')}</option>
            </select>
        </div>
    )
}
