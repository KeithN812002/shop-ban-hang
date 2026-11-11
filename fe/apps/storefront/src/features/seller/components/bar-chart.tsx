import { useId } from 'react'

export interface BarDatum {
    label: string
    value: number
    /** Tooltip text (native <title>); defaults to "label: value". */
    tooltip?: string
}

interface BarChartProps {
    data: BarDatum[]
    ariaLabel: string
    formatValue: (value: number) => string
    className?: string
}

const WIDTH = 640
const HEIGHT = 240
const PAD = { top: 12, right: 8, bottom: 28, left: 56 }
const GRID_LINES = 4

/** Rounds the max up to a "nice" number so the gridlines carry readable values. */
export const niceMax = (max: number): number => {
    if (max <= 0) return 1
    const magnitude = 10 ** Math.floor(Math.log10(max))
    const normalised = max / magnitude
    const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
    return step * magnitude
}

const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

/** Dependency-free responsive SVG bar chart (revenue / earnings per period). */
export function BarChart({ data, ariaLabel, formatValue, className }: BarChartProps) {
    const titleId = useId()
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const top = niceMax(Math.max(0, ...data.map(d => d.value)))
    const slot = data.length > 0 ? innerW / data.length : innerW
    const barW = Math.max(2, Math.min(40, slot * 0.7))
    const labelEvery = Math.max(1, Math.ceil(data.length / 8))

    return (
        <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-labelledby={titleId}
            className={className ?? 'h-auto w-full'}
        >
            <title id={titleId}>{ariaLabel}</title>
            {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
                const y = PAD.top + innerH - (innerH * i) / GRID_LINES
                return (
                    <g key={i}>
                        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} stroke="#e5e5e5" strokeDasharray={i === 0 ? undefined : '3 3'} />
                        <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="11" fill="#737373">
                            {compact.format((top * i) / GRID_LINES)}
                        </text>
                    </g>
                )
            })}
            {data.map((d, index) => {
                const h = top > 0 ? (d.value / top) * innerH : 0
                const x = PAD.left + slot * index + (slot - barW) / 2
                return (
                    <g key={`${d.label}-${index}`}>
                        <rect x={x} y={PAD.top + innerH - h} width={barW} height={Math.max(h, d.value > 0 ? 1 : 0)} rx="2" fill="#ee4d2d">
                            <title>{d.tooltip ?? `${d.label}: ${formatValue(d.value)}`}</title>
                        </rect>
                        {index % labelEvery === 0 && (
                            <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="#737373">
                                {d.label}
                            </text>
                        )}
                    </g>
                )
            })}
        </svg>
    )
}
