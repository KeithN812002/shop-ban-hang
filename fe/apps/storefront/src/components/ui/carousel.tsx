import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface CarouselProps {
    slides: ReactNode[]
    /** ms between slides; 0 disables autoplay */
    intervalMs?: number
    className?: string
}

export function Carousel({ slides, intervalMs = 5000, className }: CarouselProps) {
    const { t } = useTranslation()
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const count = slides.length

    useEffect(() => {
        if (!intervalMs || paused || count < 2) return
        const timer = window.setInterval(() => setIndex(i => (i + 1) % count), intervalMs)
        return () => window.clearInterval(timer)
    }, [intervalMs, paused, count])

    if (count === 0) return null
    const go = (delta: number) => setIndex(i => (i + delta + count) % count)

    return (
        <div
            className={cn('group relative overflow-hidden rounded-xl', className)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            aria-roledescription="carousel"
        >
            <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {slides.map((slide, i) => (
                    <div
                        key={i}
                        className="h-full w-full shrink-0"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} / ${count}`}
                        aria-hidden={i !== index}
                    >
                        {slide}
                    </div>
                ))}
            </div>
            {count > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => go(-1)}
                        aria-label={t('common.previous')}
                        className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => go(1)}
                        aria-label={t('common.next')}
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`${i + 1}`}
                                aria-current={i === index}
                                onClick={() => setIndex(i)}
                                className={cn(
                                    'h-1.5 rounded-full transition-all',
                                    i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60',
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
