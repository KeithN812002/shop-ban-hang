import { cn } from '@workspace/ui/lib/utils'

export interface TabItem<T extends string> {
    value: T
    label: string
}

interface TabBarProps<T extends string> {
    tabs: TabItem<T>[]
    value: T
    onChange: (value: T) => void
    ariaLabel: string
    className?: string
}

/** Horizontally scrollable tab strip (order status tabs, sort tabs, rating filters). */
export function TabBar<T extends string>({ tabs, value, onChange, ariaLabel, className }: TabBarProps<T>) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn('scrollbar-hide flex overflow-x-auto border-b bg-white', className)}
        >
            {tabs.map(tab => (
                <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={tab.value === value}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        'shrink-0 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors',
                        tab.value === value
                            ? 'border-brand-500 font-semibold text-brand-600'
                            : 'border-transparent text-gray-600 hover:text-brand-600',
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
