const pad = (n: number): string => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD (what <input type="date"> and the stats endpoints use). */
export const toIsoDate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const rangeLastDays = (days: number, today = new Date()): { fromDate: string; toDate: string } => {
    const from = new Date(today)
    from.setDate(from.getDate() - (days - 1))
    return { fromDate: toIsoDate(from), toDate: toIsoDate(today) }
}

export const rangeThisMonth = (today = new Date()): { fromDate: string; toDate: string } => ({
    fromDate: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    toDate: toIsoDate(today),
})

/** Now (+ `offsetDays`) as a <input type="datetime-local"> value (YYYY-MM-DDTHH:mm, local time). */
export const nowDateTimeLocal = (offsetDays = 0): string => {
    const date = new Date()
    date.setDate(date.getDate() + offsetDays)
    return `${toIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** ISO LocalDateTime (any precision) -> value accepted by <input type="datetime-local"> (YYYY-MM-DDTHH:mm). */
export const toDateTimeLocal = (iso: string | null | undefined): string => (iso ? iso.slice(0, 16) : '')

/** <input type="datetime-local"> value -> LocalDateTime string with seconds. */
export const fromDateTimeLocal = (value: string): string => (value.length === 16 ? `${value}:00` : value)
