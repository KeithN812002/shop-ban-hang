import { useEffect, useState } from 'react'

const TICK_MS = 1000

const remainingMs = (target: number | null): number | null =>
    target === null ? null : Math.max(0, target - Date.now())

/**
 * Milliseconds left until `endAt` (`YYYY-MM-DDTHH:mm:ss`, local time), ticking once a second; `null` when `endAt` is
 * empty or unparsable. The interval is cleared on unmount, when `endAt` changes and once the deadline has passed.
 */
export function useCountdown(endAt: string | null | undefined): number | null {
    const parsed = endAt ? new Date(endAt).getTime() : Number.NaN
    const target = Number.isNaN(parsed) ? null : parsed
    const [left, setLeft] = useState(() => remainingMs(target))

    useEffect(() => {
        setLeft(remainingMs(target))
        if (target === null || target <= Date.now()) return
        const timer = window.setInterval(() => {
            const next = remainingMs(target)
            setLeft(next)
            if (next === 0) window.clearInterval(timer)
        }, TICK_MS)
        return () => window.clearInterval(timer)
    }, [target])

    return left
}

/** 3725000 -> "01:02:05" (hours are not capped at 24). */
export const formatCountdown = (ms: number): string => {
    const total = Math.floor(ms / 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}
