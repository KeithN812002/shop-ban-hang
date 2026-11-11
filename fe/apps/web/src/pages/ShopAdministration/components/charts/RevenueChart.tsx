import { memo, useId, useMemo } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import type { GroupBy } from '../../constants'
import { formatCompact, formatCount, formatVnd } from '../../utils/format'
import type { RevenuePoint } from '../../types'

const WIDTH = 760
const HEIGHT = 280
const PAD = { top: 16, right: 48, bottom: 32, left: 64 }
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom
const Y_TICKS = 4
const MAX_X_LABELS = 8
const BAR_FILL_RATIO = 0.55

/** Round a data maximum up to 1/2/5 x 10^n so the axis ends on a tidy tick. */
const niceMax = (value: number): number => {
    if (value <= 0) return 1
    const magnitude = 10 ** Math.floor(Math.log10(value))
    const normalised = value / magnitude
    const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
    return step * magnitude
}

const formatPeriod = (period: string, groupBy: GroupBy): string => {
    const parsed = dayjs(period)
    if (!parsed.isValid()) return period
    return groupBy === 'MONTH' ? parsed.format('MM/YYYY') : parsed.format('DD/MM')
}

interface RevenueChartProps {
    data: RevenuePoint[]
    groupBy: GroupBy
}

/**
 * Platform GMV and revenue as lines on the left axis, order count as bars on the right axis.
 * Hand-built SVG (the workspace has no charting library); the same numbers are exposed to
 * assistive tech through a visually hidden table.
 */
export const RevenueChart = memo(({ data, groupBy }: RevenueChartProps) => {
    const { t } = useTranslation()
    const captionId = useId()

    const geometry = useMemo(() => {
        const moneyMax = niceMax(Math.max(0, ...data.map(point => Math.max(point.gmv, point.platformRevenue))))
        const orderMax = niceMax(Math.max(0, ...data.map(point => point.orders)))
        const slot = data.length > 0 ? PLOT_W / data.length : PLOT_W
        const x = (index: number) => PAD.left + slot * index + slot / 2
        const yMoney = (value: number) => PAD.top + PLOT_H - (value / moneyMax) * PLOT_H
        const yOrders = (value: number) => PAD.top + PLOT_H - (value / orderMax) * PLOT_H
        const line = (pick: (point: RevenuePoint) => number) =>
            data
                .map(
                    (point, index) =>
                        `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${yMoney(pick(point)).toFixed(1)}`,
                )
                .join(' ')
        return { moneyMax, orderMax, slot, x, yMoney, yOrders, line }
    }, [data])

    if (data.length === 0) return <EmptyState kind="no-records" variant="compact" className="min-h-[200px]" />

    const labelEvery = Math.max(1, Math.ceil(data.length / MAX_X_LABELS))
    const barWidth = Math.max(2, geometry.slot * BAR_FILL_RATIO)

    return (
        <figure className="space-y-3">
            <figcaption id={captionId} className="sr-only">
                {t('shopAdmin.dashboard.charts.revenueCaption')}
            </figcaption>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
                <li className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-primary" />
                    {t('shopAdmin.dashboard.series.gmv')}
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-emerald-500" />
                    {t('shopAdmin.dashboard.series.platformRevenue')}
                </li>
                <li className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-amber-400/60" />
                    {t('shopAdmin.dashboard.series.orders')}
                </li>
            </ul>

            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-labelledby={captionId}>
                {Array.from({ length: Y_TICKS + 1 }, (_, tick) => {
                    const ratio = tick / Y_TICKS
                    const y = PAD.top + PLOT_H - ratio * PLOT_H
                    return (
                        <g key={tick}>
                            <line
                                x1={PAD.left}
                                x2={WIDTH - PAD.right}
                                y1={y}
                                y2={y}
                                className="stroke-border"
                                strokeDasharray={tick === 0 ? undefined : '3 3'}
                            />
                            <text
                                x={PAD.left - 8}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {formatCompact(geometry.moneyMax * ratio)}
                            </text>
                            <text
                                x={WIDTH - PAD.right + 8}
                                y={y}
                                textAnchor="start"
                                dominantBaseline="middle"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {formatCompact(geometry.orderMax * ratio)}
                            </text>
                        </g>
                    )
                })}

                {data.map((point, index) => (
                    <g key={point.period}>
                        <rect
                            x={geometry.x(index) - barWidth / 2}
                            y={geometry.yOrders(point.orders)}
                            width={barWidth}
                            height={PAD.top + PLOT_H - geometry.yOrders(point.orders)}
                            rx={2}
                            className="fill-amber-400/50"
                        />
                        {index % labelEvery === 0 && (
                            <text
                                x={geometry.x(index)}
                                y={HEIGHT - PAD.bottom + 18}
                                textAnchor="middle"
                                className="fill-muted-foreground text-[11px]"
                            >
                                {formatPeriod(point.period, groupBy)}
                            </text>
                        )}
                    </g>
                ))}

                <path d={geometry.line(point => point.gmv)} fill="none" strokeWidth={2} className="stroke-primary" />
                <path
                    d={geometry.line(point => point.platformRevenue)}
                    fill="none"
                    strokeWidth={2}
                    className="stroke-emerald-500"
                />

                {data.map((point, index) => (
                    <g key={`dot-${point.period}`}>
                        <circle cx={geometry.x(index)} cy={geometry.yMoney(point.gmv)} r={3} className="fill-primary" />
                        <circle
                            cx={geometry.x(index)}
                            cy={geometry.yMoney(point.platformRevenue)}
                            r={3}
                            className="fill-emerald-500"
                        />
                        {/* Full-height hit area so the native tooltip works anywhere in the column. */}
                        <rect
                            x={geometry.x(index) - geometry.slot / 2}
                            y={PAD.top}
                            width={geometry.slot}
                            height={PLOT_H}
                            fill="transparent"
                        >
                            <title>
                                {`${formatPeriod(point.period, groupBy)}\n${t('shopAdmin.dashboard.series.gmv')}: ${formatVnd(point.gmv)}\n${t('shopAdmin.dashboard.series.platformRevenue')}: ${formatVnd(point.platformRevenue)}\n${t('shopAdmin.dashboard.series.orders')}: ${formatCount(point.orders)}`}
                            </title>
                        </rect>
                    </g>
                ))}
            </svg>

            <table className="sr-only">
                <caption>{t('shopAdmin.dashboard.charts.revenueCaption')}</caption>
                <thead>
                    <tr>
                        <th scope="col">{t('shopAdmin.dashboard.period')}</th>
                        <th scope="col">{t('shopAdmin.dashboard.series.gmv')}</th>
                        <th scope="col">{t('shopAdmin.dashboard.series.platformRevenue')}</th>
                        <th scope="col">{t('shopAdmin.dashboard.series.orders')}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(point => (
                        <tr key={point.period}>
                            <th scope="row">{formatPeriod(point.period, groupBy)}</th>
                            <td>{formatVnd(point.gmv)}</td>
                            <td>{formatVnd(point.platformRevenue)}</td>
                            <td>{formatCount(point.orders)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    )
})

RevenueChart.displayName = 'RevenueChart'
