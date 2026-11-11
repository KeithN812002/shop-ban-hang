import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Flame, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHome, useSuggest } from '@/features/catalog/queries'
import { useDebounce } from '@/hooks/use-debounce'
import { usePopover } from '@/hooks/use-popover'
import { cn } from '@workspace/ui/lib/utils'

/** Header search with autocomplete (/product/suggest) and trending keywords when empty. */
export function SearchBox({ className }: { className?: string }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const listId = useId()
    const { open, setOpen, close, ref } = usePopover<HTMLFormElement>()
    const currentKeyword = useSearch({ strict: false, select: s => (s as { keyword?: string }).keyword ?? '' })
    const [value, setValue] = useState(currentKeyword)
    const [active, setActive] = useState(-1)
    const debounced = useDebounce(value.trim(), 250)

    // Keep the box in sync when the URL keyword changes (back/forward, category switch).
    useEffect(() => setValue(currentKeyword), [currentKeyword])

    const suggest = useSuggest(debounced)
    const home = useHome()

    const isTyping = value.trim().length >= 2
    const options: string[] = isTyping ? (suggest.data ?? []) : (home.data?.trendingKeywords ?? [])

    const submit = (keyword: string) => {
        const trimmed = keyword.trim()
        close()
        setActive(-1)
        void navigate({ to: '/search', search: { keyword: trimmed || undefined } })
    }

    const onSubmit = (event: FormEvent) => {
        event.preventDefault()
        submit(active >= 0 && options[active] ? options[active] : value)
    }

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!open || options.length === 0) return
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive(i => (i + 1) % options.length)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive(i => (i <= 0 ? options.length - 1 : i - 1))
        }
    }

    return (
        <form ref={ref} role="search" onSubmit={onSubmit} className={cn('relative', className)}>
            <div className="flex overflow-hidden rounded-md bg-white shadow-sm ring-2 ring-transparent focus-within:ring-brand-300">
                <input
                    type="search"
                    value={value}
                    onChange={event => {
                        setValue(event.target.value)
                        setActive(-1)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={t('header.searchPlaceholder')}
                    aria-label={t('header.searchPlaceholder')}
                    role="combobox"
                    aria-expanded={open && options.length > 0}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    autoComplete="off"
                    className="h-10 min-w-0 flex-1 px-3 text-sm text-gray-900 outline-none"
                />
                <button
                    type="submit"
                    aria-label={t('header.search')}
                    className="m-1 flex w-12 items-center justify-center rounded bg-brand-500 text-white hover:bg-brand-600"
                >
                    <Search className="size-4" />
                </button>
            </div>

            {open && options.length > 0 && (
                <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-white py-1 shadow-xl animate-fade-in"
                >
                    {!isTyping && (
                        <li className="px-3 py-1 text-xs font-semibold tracking-wide text-gray-400 uppercase" aria-hidden>
                            {t('header.trending')}
                        </li>
                    )}
                    {options.map((option, index) => (
                        <li
                            key={option}
                            role="option"
                            aria-selected={index === active}
                            onPointerDown={event => {
                                event.preventDefault()
                                setValue(option)
                                submit(option)
                            }}
                            onPointerEnter={() => setActive(index)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-800',
                                index === active && 'bg-brand-50 text-brand-700',
                            )}
                        >
                            {isTyping ? (
                                <Search className="size-3.5 text-gray-400" aria-hidden />
                            ) : (
                                <Flame className="size-3.5 text-brand-500" aria-hidden />
                            )}
                            <span className="truncate">{option}</span>
                        </li>
                    ))}
                </ul>
            )}
        </form>
    )
}
