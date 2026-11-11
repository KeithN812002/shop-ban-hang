'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import { Label } from '@workspace/ui/components/Field'
import { Popover, PopoverDialog, PopoverTrigger } from '@workspace/ui/components/Popover'
import { Button } from '@workspace/ui/components/Button'
import { cn } from '@workspace/ui/lib/utils'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { ICON_OPTIONS } from '@/constants/options'
import { getIconComponent } from './icon-renderers'

interface BsIconPickerProps {
    label?: string
    value?: string | null
    onChange: (value: string) => void
    isRequired?: boolean
    isDisabled?: boolean
    placeholder?: string
    containerClassName?: string
}

export function BsIconPicker({
    label,
    value,
    onChange,
    isRequired,
    isDisabled,
    placeholder,
    containerClassName,
}: BsIconPickerProps) {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return ICON_OPTIONS
        return ICON_OPTIONS.filter(o => o.name.toLowerCase().includes(q))
    }, [query])

    const selectedIcon = value ? getIconComponent(value) : null

    return (
        <div className={cn('group/field relative', containerClassName)}>
            {label && (
                <Label className="mb-0! transition-colors relative flex items-center gap-1 w-fit max-w-full overflow-hidden">
                    <span className="truncate min-w-0" title={label}>
                        {label}
                    </span>
                    {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
                </Label>
            )}
            <PopoverTrigger>
                <Button
                    variant="outline"
                    isDisabled={isDisabled}
                    className={cn(
                        'justify-between w-full pr-2 h-8 py-1.5 font-normal text-start ring-inset transition-all shadow-sm rounded-sm',
                        'border-0 ring ring-input bg-background md:text-sm hover:bg-muted/40',
                        'data-[focused]:ring-primary data-[focused]:ring-2 data-[focused]:bg-primary/5',
                        'disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground',
                    )}
                >
                    {value ? (
                        <span className="flex items-center gap-2 truncate">
                            {selectedIcon || <span className="size-4" />}
                            <span className="truncate">{value}</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder ?? t('common.placeholder.selectIcon')}
                        </span>
                    )}
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </Button>
                <Popover
                    placement="bottom start"
                    shouldAllowBackgroundScroll
                    className="w-[340px] flex flex-col p-0 overflow-hidden"
                >
                    <PopoverDialog className="p-0 flex flex-col">
                        {({ close }) => (
                            <>
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <input
                                            autoFocus
                                            value={query}
                                            onChange={e => setQuery(e.target.value)}
                                            placeholder={t('common.placeholder.searchIcon')}
                                            className={cn(
                                                'w-full h-8 pl-8 pr-2 rounded-sm text-sm outline-none',
                                                'ring ring-inset ring-input bg-background-secondary',
                                                'focus:ring-primary focus:ring-2',
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-2">
                                    {filtered.length === 0 ? (
                                        <EmptyState kind="no-match" variant="compact" className="py-6" />
                                    ) : (
                                        <div className="grid grid-cols-8 gap-1">
                                            {filtered.map(option => {
                                                const isSelected = option.id === value
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        title={option.name}
                                                        onClick={() => {
                                                            onChange(option.id)
                                                            close()
                                                        }}
                                                        style={{
                                                            contentVisibility: 'auto',
                                                            containIntrinsicSize: '36px 36px',
                                                        }}
                                                        className={cn(
                                                            'flex items-center justify-center size-9 rounded-sm cursor-pointer transition-colors',
                                                            'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
                                                            isSelected &&
                                                                'bg-primary text-white hover:bg-primary hover:text-white',
                                                        )}
                                                    >
                                                        {getIconComponent(option.icon)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </PopoverDialog>
                </Popover>
            </PopoverTrigger>
        </div>
    )
}
