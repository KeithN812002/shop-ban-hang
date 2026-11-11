import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface PaginationProps {
    /** 1-based current page */
    page: number
    totalPages: number
    onChange: (page: number) => void
    className?: string
}

/** Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20 */
export const buildPageItems = (page: number, totalPages: number): Array<number | 'gap'> => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const items: Array<number | 'gap'> = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    if (start > 2) items.push('gap')
    for (let p = start; p <= end; p += 1) items.push(p)
    if (end < totalPages - 1) items.push('gap')
    items.push(totalPages)
    return items
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
    const { t } = useTranslation()
    if (totalPages <= 1) return null

    const nav = 'inline-flex size-9 items-center justify-center rounded-md border bg-white text-sm transition-colors'

    return (
        <nav aria-label={t('common.pagination')} className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}>
            <button
                type="button"
                className={cn(nav, 'hover:border-brand-500 disabled:opacity-40')}
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                aria-label={t('common.previous')}
            >
                <ChevronLeft className="size-4" />
            </button>
            {buildPageItems(page, totalPages).map((item, index) =>
                item === 'gap' ? (
                    <span key={`gap-${index}`} className="px-1 text-gray-400" aria-hidden>
                        …
                    </span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        aria-current={item === page ? 'page' : undefined}
                        onClick={() => onChange(item)}
                        className={cn(
                            nav,
                            item === page
                                ? 'border-brand-500 bg-brand-500 font-semibold text-white'
                                : 'hover:border-brand-500 hover:text-brand-600',
                        )}
                    >
                        {item}
                    </button>
                ),
            )}
            <button
                type="button"
                className={cn(nav, 'hover:border-brand-500 disabled:opacity-40')}
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
                aria-label={t('common.next')}
            >
                <ChevronRight className="size-4" />
            </button>
        </nav>
    )
}
