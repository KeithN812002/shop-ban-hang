import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { cn } from '@workspace/ui/lib/utils'

export interface NewsTickerMessage {
    id: string
    text: string
    variant?: 'default' | 'primary' | 'destructive' | 'warning' | 'success'
}

interface NewsTickerProps {
    messages: NewsTickerMessage[]
    speed?: number // px per second, default 60
    className?: string
}

const variantStyles: Record<string, string> = {
    default: 'text-foreground',
    primary: 'text-blue-600 font-semibold',
    destructive: 'text-red-600 font-semibold',
    warning: 'text-amber-600 font-semibold',
    success: 'text-green-600 font-semibold',
}

function NewsTicker({ messages, speed = 60, className }: NewsTickerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [duration, setDuration] = useState(20)
    const [repeatCount, setRepeatCount] = useState(3)
    const [isPaused, setIsPaused] = useState(false)
    const safeSpeed = Math.max(speed, 10)
    const hasMessages = messages.length > 0

    // Measure widths and compute:
    // - animation duration based on one content group
    // - repeat count so the viewport is always fully covered
    useEffect(() => {
        const container = containerRef.current
        const content = contentRef.current
        if (!container || !content || messages.length === 0) return

        const recalculate = () => {
            const contentWidth = content.scrollWidth
            const containerWidth = container.clientWidth
            if (contentWidth > 0) {
                const nextDuration = contentWidth / safeSpeed
                setDuration(prev => {
                    // Avoid tiny recalculations that can restart animation and look like stutter.
                    return Math.abs(prev - nextDuration) > 0.2 ? nextDuration : prev
                })

                const nextRepeatCount = Math.max(3, Math.ceil(containerWidth / contentWidth) + 2)
                setRepeatCount(prev => (prev !== nextRepeatCount ? nextRepeatCount : prev))
            }
        }

        recalculate()

        const observer = new ResizeObserver(() => {
            recalculate()
        })
        observer.observe(container)
        observer.observe(content)

        return () => observer.disconnect()
    }, [messages, safeSpeed])

    const renderMessages = useCallback(
        (keyPrefix: string) =>
            messages.map((msg, idx) => (
                <span
                    key={`${keyPrefix}-${msg.id}-${idx}`}
                    className={cn('text-sm', variantStyles[msg.variant || 'default'])}
                >
                    {msg.text}
                </span>
            )),
        [messages],
    )

    const duplicateGroups = useMemo(() => {
        return Array.from({ length: repeatCount - 1 }, (_, index) => (
            <div key={`group-${index + 1}`} className="flex shrink-0 gap-20 pr-20" aria-hidden="true">
                {renderMessages(`group-${index + 1}`)}
            </div>
        ))
    }, [renderMessages, repeatCount])

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative w-full overflow-hidden bg-background border-b border-border py-2 select-none',
                className,
            )}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Fade mask left */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            {/* Fade mask right */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            {/* Scrolling track */}
            {hasMessages ? (
                <div
                    className="flex w-max whitespace-nowrap"
                    style={{
                        animationName: 'ticker-scroll',
                        animationDuration: `${duration}s`,
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationPlayState: isPaused ? 'paused' : 'running',
                        ['--ticker-shift' as string]: `-${100 / repeatCount}%`,
                        transform: 'translate3d(0, 0, 0)',
                        willChange: 'transform',
                    }}
                >
                    <div ref={contentRef} className="flex shrink-0 gap-20 pr-20">
                        {renderMessages('group-a')}
                    </div>
                    {duplicateGroups}
                </div>
            ) : (
                <div className="h-[21px]" aria-hidden="true" />
            )}
        </div>
    )
}

export { NewsTicker }
