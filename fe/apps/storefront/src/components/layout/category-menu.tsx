import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'
import { CategoryIcon } from '@/features/catalog/components/category-icon'
import { useCategoryTree } from '@/features/catalog/queries'
import { usePopover } from '@/hooks/use-popover'

/** "All categories" mega-menu: root list on the left, sub-categories of the hovered root on the right. */
export function CategoryMenu({ className }: { className?: string }) {
    const { t } = useTranslation()
    const { data: tree = [] } = useCategoryTree()
    const { open, toggle, close, ref } = usePopover()
    const [activeId, setActiveId] = useState<string | null>(null)

    const active = tree.find(node => node.id === activeId) ?? tree[0]

    return (
        <div ref={ref} className={cn('relative', className)}>
            <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="true"
                className="flex h-10 items-center gap-2 rounded-md bg-white/15 px-3 text-sm font-medium text-white hover:bg-white/25"
            >
                <LayoutGrid className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t('header.categories')}</span>
            </button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 flex w-[min(92vw,720px)] overflow-hidden rounded-lg border bg-white shadow-2xl animate-fade-in">
                    {tree.length === 0 ? (
                        <p className="p-6 text-sm text-gray-500">{t('header.noCategories')}</p>
                    ) : (
                        <>
                            <ul className="max-h-[70vh] w-56 shrink-0 overflow-y-auto border-r bg-gray-50 py-1">
                                {tree.map(node => (
                                    <li key={node.id}>
                                        <Link
                                            to="/search"
                                            search={{ categoryId: node.id }}
                                            onClick={close}
                                            onMouseEnter={() => setActiveId(node.id)}
                                            onFocus={() => setActiveId(node.id)}
                                            className={cn(
                                                'flex items-center justify-between px-4 py-2.5 text-sm',
                                                active?.id === node.id
                                                    ? 'bg-white font-semibold text-brand-600'
                                                    : 'text-gray-700 hover:bg-white',
                                            )}
                                        >
                                            <span className="truncate">{node.name}</span>
                                            <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="max-h-[70vh] flex-1 overflow-y-auto p-4">
                                {active && (
                                    <>
                                        <Link
                                            to="/search"
                                            search={{ categoryId: active.id }}
                                            onClick={close}
                                            className="mb-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
                                        >
                                            {t('header.allIn', { name: active.name })}
                                        </Link>
                                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {(active.children ?? []).map(child => (
                                                <li key={child.id}>
                                                    <Link
                                                        to="/search"
                                                        search={{ categoryId: child.id }}
                                                        onClick={close}
                                                        className="flex flex-col items-center gap-1.5 rounded-md p-2 text-center text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                                                    >
                                                        <CategoryIcon
                                                            category={child}
                                                            fallbackIcon={active.icon}
                                                            className="size-14"
                                                        />
                                                        <span className="line-clamp-2">{child.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
