'use client'

import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
    Tab as AriaTab,
    TabList as AriaTabList,
    TabListProps as AriaTabListProps,
    TabListStateContext,
    TabPanel as AriaTabPanel,
    TabPanelProps as AriaTabPanelProps,
    TabProps as AriaTabProps,
    Tabs as AriaTabs,
    TabsContext,
    TabsProps as AriaTabsProps,
    composeRenderProps,
} from 'react-aria-components'
import { MoreHorizontal } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/Button'
import { Popover, PopoverTrigger } from '@workspace/ui/components/Popover'

function Tabs({ className, ...props }: AriaTabsProps) {
    return (
        <AriaTabs
            className={composeRenderProps(className, className =>
                cn(
                    'group -mt-2 flex flex-col gap-4',
                    /* Orientation */
                    'data-[orientation=vertical]:flex-row',
                    className,
                ),
            )}
            {...props}
        />
    )
}

const tabListClassName = (className: AriaTabListProps<object>['className']) =>
    composeRenderProps(className, className =>
        cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            /* Orientation */
            'data-[orientation=vertical]:h-auto data-[orientation=vertical]:flex-col',
            className,
        ),
    )

type TabListStateType = NonNullable<React.ContextType<typeof TabListStateContext>>
type TabKey = Exclude<Parameters<TabListStateType['setSelectedKey']>[0], null>

interface OverflowItem {
    key: TabKey
    label: ReactNode
}

const CLOSE_DELAY = 150

const areItemsEqual = (a: OverflowItem[], b: OverflowItem[]) =>
    a.length === b.length && a.every((item, index) => item.key === b[index]?.key)

const TabList = <T extends object>({ className, ...props }: AriaTabListProps<T>) => {
    const tabsContext = useContext(TabsContext)
    const orientation = (tabsContext && 'orientation' in tabsContext && tabsContext.orientation) || 'horizontal'
    const state = useContext(TabListStateContext)

    const scrollRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [overflowItems, setOverflowItems] = useState<OverflowItem[]>([])

    const collectionRef = useRef(state?.collection)
    collectionRef.current = state?.collection

    const measure = useCallback(() => {
        const scrollEl = scrollRef.current
        const listEl = listRef.current
        const collection = collectionRef.current
        if (!scrollEl || !listEl || !collection) return

        const nodes = [...collection]
        const tabEls = listEl.querySelectorAll<HTMLElement>('[role="tab"]')
        const scrollRect = scrollEl.getBoundingClientRect()

        const next: OverflowItem[] = []
        tabEls.forEach((el, index) => {
            const node = nodes[index]
            if (!node) return
            const rect = el.getBoundingClientRect()
            const isClipped = rect.right > scrollRect.right + 1 || rect.left < scrollRect.left - 1
            if (isClipped) next.push({ key: node.key, label: node.rendered ?? node.textValue })
        })

        setOverflowItems(prev => (areItemsEqual(prev, next) ? prev : next))
    }, [])

    useLayoutEffect(() => {
        const scrollEl = scrollRef.current
        const listEl = listRef.current
        if (!scrollEl) return

        measure()

        const observer = new ResizeObserver(() => measure())
        observer.observe(scrollEl)
        if (listEl) observer.observe(listEl)
        scrollEl.addEventListener('scroll', measure, { passive: true })

        return () => {
            observer.disconnect()
            scrollEl.removeEventListener('scroll', measure)
        }
    }, [measure])

    useEffect(() => {
        measure()
    }, [measure, state?.collection.size, state?.selectedKey])

    const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
        const container = scrollRef.current
        if (!container || container.scrollWidth <= container.clientWidth) return
        if (Math.abs(event.deltaX) > 0 || event.deltaY === 0) return
        event.preventDefault()
        container.scrollBy({ left: event.deltaY, behavior: 'auto' })
    }, [])

    // Hover-controlled popover open state.
    const [isOpen, setIsOpen] = useState(false)
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancelClose = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }, [])
    const open = useCallback(() => {
        cancelClose()
        setIsOpen(true)
    }, [cancelClose])
    const scheduleClose = useCallback(() => {
        cancelClose()
        closeTimer.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY)
    }, [cancelClose])

    useEffect(() => () => cancelClose(), [cancelClose])

    const handleSelect = useCallback(
        (key: TabKey) => {
            state?.setSelectedKey(key)
            cancelClose()
            setIsOpen(false)
            // Scroll the newly selected tab into view.
            requestAnimationFrame(() => {
                const listEl = listRef.current
                const collection = collectionRef.current
                if (!listEl || !collection) return
                const index = [...collection].findIndex(node => node.key === key)
                const tabEl = listEl.querySelectorAll<HTMLElement>('[role="tab"]')[index]
                tabEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            })
        },
        [state, cancelClose],
    )

    // The overflow popover only makes sense for a horizontal tab bar.
    if (orientation === 'vertical') {
        return <AriaTabList className={tabListClassName(className)} {...props} />
    }

    return (
        <div className="relative flex w-full min-w-0 items-center">
            <div
                ref={scrollRef}
                onWheel={handleWheel}
                className="min-w-0 flex-1 overflow-x-auto scrollbar-hide focus:outline-none"
            >
                <AriaTabList ref={listRef} className={tabListClassName(className)} {...props} />
            </div>
            {overflowItems.length > 0 && (
                <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Show more tabs"
                        className="ml-1 size-8 shrink-0"
                        onHoverStart={open}
                        onHoverEnd={scheduleClose}
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                    <Popover className="min-w-44" isNonModal>
                        <div
                            onPointerEnter={cancelClose}
                            onPointerLeave={scheduleClose}
                            className="flex max-h-72 flex-col gap-0.5 overflow-y-auto p-1"
                        >
                            {overflowItems.map(item => (
                                <button
                                    key={String(item.key)}
                                    type="button"
                                    onClick={() => handleSelect(item.key)}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors',
                                        'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
                                        state?.selectedKey === item.key &&
                                            'bg-accent font-medium text-accent-foreground',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </Popover>
                </PopoverTrigger>
            )}
        </div>
    )
}

const Tab = ({ className, ...props }: AriaTabProps) => (
    <AriaTab
        className={composeRenderProps(className, className =>
            cn(
                'inline-flex cursor-pointer justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium outline-none ring-offset-background transition-all',
                /* Focus Visible */
                'data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2',
                /* Disabled */
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                /* Selected */
                'data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm ',
                /* Orientation */
                'group-data-[orientation=vertical]:w-full',
                className,
            ),
        )}
        {...props}
    />
)

const TabPanel = ({ className, ...props }: AriaTabPanelProps) => (
    <AriaTabPanel
        className={composeRenderProps(className, className =>
            cn(
                'ring-offset-background',
                /* Focus Visible */
                'data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2',
                className,
            ),
        )}
        {...props}
    />
)

export { Tabs, TabList, TabPanel, Tab }
