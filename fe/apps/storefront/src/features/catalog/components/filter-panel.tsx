import { useEffect, useState, type FormEvent } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form-controls'
import { useCategoryTree } from '@/features/catalog/queries'
import type { SearchFilters } from '@/features/catalog/search-params'
import type { CategoryNode } from '@/types/shop'

interface FilterPanelProps {
    filters: SearchFilters
    onChange: (patch: Partial<SearchFilters>) => void
    onClear: () => void
}

function CategoryList({
    nodes,
    selected,
    onSelect,
    depth = 0,
}: {
    nodes: CategoryNode[]
    selected?: string
    onSelect: (id: string) => void
    depth?: number
}) {
    return (
        <ul className={cn(depth > 0 && 'ml-3 border-l pl-2')}>
            {nodes.map(node => {
                const hasSelectedChild = (node.children ?? []).some(c => c.id === selected)
                return (
                    <li key={node.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(node.id)}
                            aria-current={selected === node.id}
                            className={cn(
                                'w-full rounded px-2 py-1.5 text-left text-sm hover:text-brand-600',
                                selected === node.id ? 'font-semibold text-brand-600' : 'text-gray-700',
                            )}
                        >
                            {node.name}
                        </button>
                        {node.children && node.children.length > 0 && (selected === node.id || hasSelectedChild) && (
                            <CategoryList nodes={node.children} selected={selected} onSelect={onSelect} depth={depth + 1} />
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
    const { t } = useTranslation()
    const { data: tree = [] } = useCategoryTree()
    const [min, setMin] = useState(filters.minPrice?.toString() ?? '')
    const [max, setMax] = useState(filters.maxPrice?.toString() ?? '')

    useEffect(() => {
        setMin(filters.minPrice?.toString() ?? '')
        setMax(filters.maxPrice?.toString() ?? '')
    }, [filters.minPrice, filters.maxPrice])

    const applyPrice = (event: FormEvent) => {
        event.preventDefault()
        const minPrice = min === '' ? undefined : Number(min)
        const maxPrice = max === '' ? undefined : Number(max)
        // Swap when the range is inverted instead of returning an empty page.
        if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            onChange({ minPrice: maxPrice, maxPrice: minPrice })
        } else {
            onChange({ minPrice, maxPrice })
        }
    }

    const heading = 'mb-2 text-sm font-semibold text-gray-900 uppercase'

    return (
        <aside aria-label={t('search.filters')} className="space-y-5 rounded-lg bg-white p-4">
            <section>
                <h2 className={heading}>{t('search.category')}</h2>
                {tree.length > 0 ? (
                    <CategoryList
                        nodes={tree}
                        selected={filters.categoryId}
                        onSelect={id => onChange({ categoryId: filters.categoryId === id ? undefined : id })}
                    />
                ) : (
                    <p className="text-sm text-gray-400">{t('header.noCategories')}</p>
                )}
            </section>

            <section>
                <h2 className={heading}>{t('search.priceRange')}</h2>
                <form onSubmit={applyPrice} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={min}
                            onChange={e => setMin(e.target.value)}
                            placeholder={t('search.priceFrom')}
                            aria-label={t('search.priceFrom')}
                        />
                        <span aria-hidden>–</span>
                        <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={max}
                            onChange={e => setMax(e.target.value)}
                            placeholder={t('search.priceTo')}
                            aria-label={t('search.priceTo')}
                        />
                    </div>
                    <Button type="submit" block>
                        {t('common.apply')}
                    </Button>
                </form>
            </section>

            <section>
                <h2 className={heading}>{t('search.rating')}</h2>
                <ul className="space-y-1">
                    {[5, 4, 3, 2, 1].map(stars => (
                        <li key={stars}>
                            <button
                                type="button"
                                aria-pressed={filters.minRating === stars}
                                onClick={() => onChange({ minRating: filters.minRating === stars ? undefined : stars })}
                                className={cn(
                                    'flex w-full items-center gap-1 rounded px-2 py-1 text-sm',
                                    filters.minRating === stars ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-gray-50',
                                )}
                            >
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                        key={i}
                                        className={cn('size-4', i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300')}
                                        aria-hidden
                                    />
                                ))}
                                {stars < 5 && <span className="ml-1">{t('search.andUp')}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <Button variant="outline" block onClick={onClear}>
                {t('search.clearFilters')}
            </Button>
        </aside>
    )
}
