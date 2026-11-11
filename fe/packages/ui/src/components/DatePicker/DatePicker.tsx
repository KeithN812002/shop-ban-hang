'use client'
import { CalendarIcon, Clock, X, ArrowRight } from 'lucide-react'
import React from 'react'
import {
    DatePicker as AriaDatePicker,
    DateRangePicker as AriaDateRangePicker,
    Dialog as AriaDialog,
    DialogProps as AriaDialogProps,
    PopoverProps as AriaPopoverProps,
    composeRenderProps,
} from 'react-aria-components'
import { cn } from '@workspace/ui/lib/utils'
import {
    parseDate,
    parseDateTime,
    today,
    getLocalTimeZone,
    CalendarDateTime,
    now,
    toCalendarDateTime,
    type DateValue,
} from '@internationalized/date'
import { DatePickerStateContext } from 'react-aria-components'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import { Controller, useFormContext, type Control, type RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@workspace/ui/components/Button'
import {
    Calendar,
    CalendarCell,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHeader,
    CalendarHeaderCell,
    CalendarHeading,
    RangeCalendar,
} from '@workspace/ui/components/Calendar'
import { DateInput } from '@workspace/ui/components/Datefield'
import { Label, FieldGroup } from '@workspace/ui/components/Field'
import {
    getFieldHighlightControlClass,
    getFieldHighlightLabelClass,
    getFieldHighlightMessageClass,
} from '@workspace/ui/lib/fieldHighlight'
import { Popover } from '@workspace/ui/components/Popover'
import type { BsDatePickerProps, BsDateRangePickerValue, BsDateRangePickerProps } from './DatePicker.types'

const DatePicker = AriaDatePicker

const DateRangePicker = AriaDateRangePicker

const DatePickerContent = ({
    className,
    popoverClassName,
    ...props
}: AriaDialogProps & { popoverClassName?: AriaPopoverProps['className'] }) => (
    <Popover
        className={composeRenderProps(popoverClassName, className =>
            cn('w-auto p-1 shadow-2xl rounded-2xl border-none bg-background/95 backdrop-blur-md', className),
        )}
    >
        <AriaDialog className={cn('flex w-full flex-col outline-none p-2', className)} {...props} />
    </Popover>
)

const toCalendarDateTimeValue = (value: DateValue, hour = 0, minute = 0): CalendarDateTime => {
    if ('hour' in value) {
        return value as CalendarDateTime
    }

    return new CalendarDateTime(value.year, value.month, value.day, hour, minute)
}

const formatDateTimeValue = (value: DateValue): string => {
    if ('hour' in value) {
        return value.toString().substring(0, 16)
    }

    return value.toString()
}

type DatePickerState = NonNullable<React.ContextType<typeof DatePickerStateContext>>

const resolvePickerDateTime = (state: DatePickerState): CalendarDateTime => {
    if (state.value) {
        return toCalendarDateTimeValue(state.value)
    }

    if (state.dateValue) {
        return toCalendarDateTimeValue(state.dateValue, state.timeValue?.hour ?? 0, state.timeValue?.minute ?? 0)
    }

    if (state.timeValue && 'hour' in state.timeValue) {
        const fallbackDate = today(getLocalTimeZone())
        return new CalendarDateTime(
            fallbackDate.year,
            fallbackDate.month,
            fallbackDate.day,
            state.timeValue.hour,
            state.timeValue.minute,
        )
    }

    const fallbackDate = today(getLocalTimeZone())
    return new CalendarDateTime(fallbackDate.year, fallbackDate.month, fallbackDate.day, 0, 0)
}

interface DateTimeBounds {
    min?: CalendarDateTime | null
    max?: CalendarDateTime | null
}

const isAfterMax = (value: CalendarDateTime, { max }: DateTimeBounds) => !!max && value.compare(max) > 0
const isBeforeMin = (value: CalendarDateTime, { min }: DateTimeBounds) => !!min && value.compare(min) < 0

const clampDateTime = (value: CalendarDateTime, bounds: DateTimeBounds): CalendarDateTime => {
    if (bounds.max && isAfterMax(value, bounds)) return bounds.max
    if (bounds.min && isBeforeMin(value, bounds)) return bounds.min
    return value
}

const applyPickerDateTime = (state: DatePickerState, next: CalendarDateTime) => {
    if (state.value) {
        state.setValue(next)
        return
    }

    if (state.dateValue && state.setTimeValue) {
        state.setTimeValue(next)
        return
    }

    state.setValue(next)
}

function TimeScrollPicker({ bounds }: { bounds: DateTimeBounds }) {
    const state = React.useContext(DatePickerStateContext)
    const hourRef = React.useRef<HTMLDivElement>(null)
    const minuteRef = React.useRef<HTMLDivElement>(null)

    const isOpen = state?.isOpen
    const dateTimeValue = state ? resolvePickerDateTime(state) : null
    const currentHour = dateTimeValue?.hour ?? 0
    const currentMinute = dateTimeValue?.minute ?? 0

    const hasValue = !!dateTimeValue
    const wasOpenRef = React.useRef(false)

    React.useEffect(() => {
        if (!isOpen) {
            wasOpenRef.current = false
            return
        }
        if (!hasValue) return
        const behavior: ScrollBehavior = wasOpenRef.current ? 'smooth' : 'auto'
        const centerOn = (column: HTMLDivElement | null, value: number) => {
            const item = column?.querySelector<HTMLElement>(`[data-value="${value}"]`)
            if (!column || !item) return
            column.scrollTo({ top: item.offsetTop - (column.clientHeight - item.offsetHeight) / 2, behavior })
        }
        const center = () => {
            centerOn(hourRef.current, currentHour)
            centerOn(minuteRef.current, currentMinute)
        }
        const frame = requestAnimationFrame(() => {
            center()
            wasOpenRef.current = true
        })
        const observer = new ResizeObserver(center)
        if (hourRef.current) observer.observe(hourRef.current)
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
        }
    }, [isOpen, hasValue, currentHour, currentMinute])

    if (!state) return null

    const base = resolvePickerDateTime(state)
    const isHourDisabled = (h: number) =>
        isAfterMax(base.set({ hour: h, minute: 0 }), bounds) || isBeforeMin(base.set({ hour: h, minute: 59 }), bounds)
    const isMinuteDisabled = (m: number) =>
        isAfterMax(base.set({ minute: m }), bounds) || isBeforeMin(base.set({ minute: m }), bounds)

    const renderColumn = (
        ref: React.RefObject<HTMLDivElement | null>,
        count: number,
        selected: number,
        isDisabled: (v: number) => boolean,
        toValue: (v: number) => CalendarDateTime,
    ) => (
        <div ref={ref} className="relative flex h-full w-12 flex-col overflow-y-auto scrollbar-hide py-[80px]">
            {Array.from({ length: count }).map((_, v) => {
                const disabled = isDisabled(v)
                return (
                    <button
                        key={v}
                        data-value={v}
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'h-8 flex-shrink-0 flex items-center justify-center text-sm tabular-nums transition-colors rounded-md mx-0.5',
                            v === selected
                                ? 'bg-primary text-white font-semibold shadow-sm z-20'
                                : disabled
                                  ? 'text-muted-foreground/25 cursor-not-allowed'
                                  : 'text-muted-foreground/60 hover:bg-muted hover:text-foreground',
                        )}
                        onClick={() => applyPickerDateTime(state, clampDateTime(toValue(v), bounds))}
                    >
                        {v.toString().padStart(2, '0')}
                    </button>
                )
            })}
        </div>
    )

    return (
        <div className="relative min-h-0 flex-1">
            <div className="absolute inset-0 flex gap-1 group/picker">
                {renderColumn(hourRef, 24, currentHour, isHourDisabled, h => base.set({ hour: h }))}

                <div className="w-px bg-input/30 self-stretch my-2" />

                {renderColumn(minuteRef, 60, currentMinute, isMinuteDisabled, m => base.set({ minute: m }))}

                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
            </div>
        </div>
    )
}

function TimePickerSection({ showTime, bounds }: { showTime?: boolean; bounds: DateTimeBounds }) {
    const state = React.useContext(DatePickerStateContext)
    if (!state || !showTime) return null

    return (
        <div className="flex flex-col items-stretch px-2 py-2 w-[120px]">
            <div className="flex h-7 w-full items-center justify-center gap-1.5 border-b border-input/20 pb-2 mb-1 box-content text-xs font-semibold text-muted-foreground">
                <Clock className="size-3.5" />
                Giờ
            </div>
            <TimeScrollPicker bounds={bounds} />
        </div>
    )
}

function TodayButton({ showTime }: { showTime?: boolean }) {
    const state = React.useContext(DatePickerStateContext)
    if (!state) return null

    return (
        <div className="p-2">
            <Button
                variant="secondary"
                className="w-full text-primary font-bold h-9 rounded-lg border shadow-sm hover:bg-primary/5 active:scale-[0.98] transition-all uppercase tracking-wider"
                onPress={() => {
                    if (showTime) {
                        state.setValue(toCalendarDateTime(now(getLocalTimeZone())))
                    } else {
                        state.setValue(today(getLocalTimeZone()))
                    }
                    state.setOpen(false)
                }}
            >
                Hôm nay
            </Button>
        </div>
    )
}

const getIconColorClass = (hasError?: boolean) => {
    return cn('size-4 text-muted-foreground transition-colors group-focus-within/field:text-primary', {
        'text-destructive group-focus-within/field:text-destructive': hasError,
    })
}

const parseCustomDateString = (val: string) => {
    if (!val) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return val
    }
    // Parse "Tháng MM/YYYY"
    const monthMatch = val.match(/Tháng\s*(\d{2})\/(\d{4})/i)
    if (monthMatch) {
        return `${monthMatch[2]}-${monthMatch[1]}-01`
    }
    // Parse "Q[1-4]/YYYY"
    const quarterMatch = val.match(/Q(\d)\/(\d{4})/i)
    if (quarterMatch) {
        const q = parseInt(quarterMatch[1], 10)
        const year = quarterMatch[2]
        const m = q === 1 ? '01' : q === 2 ? '04' : q === 3 ? '07' : '10'
        return `${year}-${m}-01`
    }
    // Parse "YYYY"
    if (/^\d{4}$/.test(val)) {
        return `${val}-01-01`
    }
    return null
}

function CustomPeriodCalendar({
    value,
    onChange,
    viewMode,
}: {
    value?: string
    onChange: (val: string) => void
    viewMode: 'month' | 'quarter' | 'year'
}) {
    const initialYear = React.useMemo(() => {
        if (!value) return new Date().getFullYear()
        const match = value.match(/\b\d{4}\b/)
        return match ? parseInt(match[0], 10) : new Date().getFullYear()
    }, [value])

    const [pickerYear, setPickerYear] = React.useState(initialYear)

    React.useEffect(() => {
        setPickerYear(initialYear)
    }, [initialYear])

    if (viewMode === 'month') {
        return (
            <div className="w-64 p-3 select-none flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev - 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &lt;&lt;
                    </button>
                    <span className="font-extrabold text-slate-800 text-sm">{pickerYear}</span>
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev + 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &gt;&gt;
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                    {Array.from({ length: 12 }).map((_, idx) => {
                        const mVal = idx + 1
                        const mStr = mVal < 10 ? `0${mVal}` : `${mVal}`
                        const monthLabel = `Th${mVal}`
                        const isSelected = value === `Tháng ${mStr}/${pickerYear}`
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => onChange(`Tháng ${mStr}/${pickerYear}`)}
                                className={cn(
                                    'py-1.5 text-xs rounded-md transition-all font-medium',
                                    isSelected
                                        ? 'bg-slate-900 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-100',
                                )}
                            >
                                {monthLabel}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (viewMode === 'quarter') {
        return (
            <div className="w-64 p-3 select-none flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev - 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &lt;&lt;
                    </button>
                    <span className="font-extrabold text-slate-800 text-sm">{pickerYear}</span>
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev + 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &gt;&gt;
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                        const isSelected = value === `${q}/${pickerYear}`
                        return (
                            <button
                                key={q}
                                type="button"
                                onClick={() => onChange(`${q}/${pickerYear}`)}
                                className={cn(
                                    'py-2 text-xs rounded-md transition-all font-medium',
                                    isSelected
                                        ? 'bg-slate-900 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-100',
                                )}
                            >
                                {q}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    if (viewMode === 'year') {
        return (
            <div className="w-64 p-3 select-none flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev - 9)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &lt;&lt;
                    </button>
                    <span className="font-extrabold text-slate-800 text-sm">
                        {pickerYear - 4} - {pickerYear + 4}
                    </span>
                    <button
                        type="button"
                        onClick={() => setPickerYear(prev => prev + 9)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors text-xs font-extrabold"
                    >
                        &gt;&gt;
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 9 }).map((_, idx) => {
                        const yVal = pickerYear - 4 + idx
                        const isSelected = value === `${yVal}`
                        return (
                            <button
                                key={yVal}
                                type="button"
                                onClick={() => onChange(`${yVal}`)}
                                className={cn(
                                    'py-2 text-xs rounded-md transition-all font-medium',
                                    isSelected
                                        ? 'bg-slate-900 text-white font-bold'
                                        : 'text-slate-600 hover:bg-slate-100',
                                )}
                            >
                                {yVal}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return null
}

function BsDatePickerCore({
    value: controlledValue,
    onChange: controlledOnChange,
    defaultValue,
    minValue,
    maxValue,
    className,
    isDisabled,
    showTime,
    isInvalid,
    isOpen: controlledIsOpen,
    setIsOpen: controlledSetIsOpen,
    isFocused,
    setIsFocused,
    viewMode = 'day',
    fieldHighlight,
    isClearable = true,
    autoFocus,
    ...props
}: BsDatePickerProps & {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
    isFocused?: boolean
    setIsFocused?: (focused: boolean) => void
}) {
    const [localIsOpen, localSetIsOpen] = React.useState(false)
    const isOpen = controlledIsOpen ?? localIsOpen
    const setIsOpen = controlledSetIsOpen ?? localSetIsOpen

    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue)

    const value = controlledValue ?? uncontrolledValue
    const onChange = controlledOnChange ?? setUncontrolledValue

    const getSafeValue = () => {
        if (!value) return null
        try {
            const parsedCustom = parseCustomDateString(value)
            if (parsedCustom) {
                return showTime ? parseDateTime(`${parsedCustom}T00:00`.substring(0, 16)) : parseDate(parsedCustom)
            }
            if (showTime) {
                const normalized = value.includes('T') ? value.replace(' ', 'T') : `${value}T00:00`
                return parseDateTime(normalized.substring(0, 16))
            }
            return parseDate(value.split(/[T ]/)[0])
        } catch (_e) {
            console.warn('BsDatePicker: Invalid date format', value)
            return null
        }
    }

    const parsedMin = React.useMemo(
        () =>
            minValue ? (showTime ? parseDateTime(minValue.substring(0, 16)) : parseDate(minValue.split('T')[0])) : null,
        [minValue, showTime],
    )
    const parsedMax = React.useMemo(
        () =>
            maxValue ? (showTime ? parseDateTime(maxValue.substring(0, 16)) : parseDate(maxValue.split('T')[0])) : null,
        [maxValue, showTime],
    )
    const timeBounds = React.useMemo<DateTimeBounds>(
        () => ({
            min: parsedMin ? toCalendarDateTimeValue(parsedMin) : null,
            max: parsedMax ? toCalendarDateTimeValue(parsedMax, 23, 59) : null,
        }),
        [parsedMin, parsedMax],
    )

    const placeholderText = React.useMemo(() => {
        if (viewMode === 'month') return 'Chọn tháng'
        if (viewMode === 'quarter') return 'Chọn các quý'
        if (viewMode === 'year') return 'Chọn năm'
        return 'Chọn ngày'
    }, [viewMode])

    return (
        <AriaDatePicker
            aria-label="Date Picker"
            autoFocus={autoFocus}
            isInvalid={isInvalid || (props as any)['aria-invalid']}
            className={composeRenderProps(className, className => cn('w-full', className))}
            value={getSafeValue()}
            onChange={value => {
                if (!value) {
                    onChange('')
                    return
                }

                if (!showTime) {
                    onChange(value.toString())
                    return
                }

                const dateTime = toCalendarDateTimeValue(value)
                const isTyping = document.activeElement?.getAttribute('role') === 'spinbutton'
                onChange(formatDateTimeValue(isTyping ? dateTime : clampDateTime(dateTime, timeBounds)))
            }}
            minValue={parsedMin}
            maxValue={parsedMax}
            granularity={showTime ? 'minute' : undefined}
            hourCycle={showTime ? 24 : undefined}
            hideTimeZone={showTime ? true : undefined}
            shouldCloseOnSelect={true}
            isDisabled={isDisabled}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            onFocusChange={setIsFocused}
            {...props}
        >
            <FieldGroup
                isInvalid={isInvalid}
                className={cn(
                    'h-8 px-2 gap-1',
                    !isInvalid && fieldHighlight && getFieldHighlightControlClass(fieldHighlight),
                )}
            >
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="-ml-1 shrink-0 data-[focus-visible]:ring-offset-0"
                    excludeFromTabOrder
                >
                    <CalendarIcon
                        aria-hidden
                        className={cn(
                            'size-4 text-muted-foreground transition-colors',
                            isFocused && 'text-primary',
                            isInvalid && 'text-destructive',
                        )}
                    />
                </Button>
                {viewMode && viewMode !== 'day' ? (
                    <button
                        type="button"
                        onClick={() => !isDisabled && setIsOpen?.(!isOpen)}
                        className={cn(
                            'flex-1 text-sm text-left select-none outline-none focus:outline-none focus:ring-0 truncate',
                            value ? 'text-slate-800 font-medium' : 'text-slate-400',
                        )}
                        disabled={isDisabled}
                    >
                        {value || placeholderText}
                    </button>
                ) : (
                    <DateInput
                        className={cn(
                            'flex-1 transition-colors',
                            !value && isDisabled && '[&_span]:text-transparent! text-transparent!',
                        )}
                        variant="ghost"
                        isInvalid={isInvalid}
                        isFocused={isFocused}
                    />
                )}
                {isClearable && value && !isDisabled && (
                    <Button
                        slot={null as any}
                        variant="ghost"
                        size="iconSm"
                        className="-mr-1"
                        onPress={() => {
                            onChange('')
                        }}
                        excludeFromTabOrder
                    >
                        <X className={getIconColorClass(isInvalid)} />
                    </Button>
                )}
            </FieldGroup>
            <DatePickerContent>
                {viewMode && viewMode !== 'day' ? (
                    <CustomPeriodCalendar
                        value={value}
                        onChange={val => {
                            onChange(val)
                            setIsOpen?.(false)
                        }}
                        viewMode={viewMode}
                    />
                ) : (
                    <>
                        <TodayButton showTime={showTime} />
                        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x border-t border-input/50">
                            <Calendar className="p-2 border-none">
                                <CalendarHeading />
                                <CalendarGrid className="w-full">
                                    <CalendarGridHeader>
                                        {day => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                                    </CalendarGridHeader>
                                    <CalendarGridBody>{date => <CalendarCell date={date} />}</CalendarGridBody>
                                </CalendarGrid>
                            </Calendar>
                            <TimePickerSection showTime={showTime} bounds={timeBounds} />
                        </div>
                    </>
                )}
            </DatePickerContent>
        </AriaDatePicker>
    )
}

type BsDatePickerFieldProps = BsDatePickerProps & {
    label?: string
    isRequired?: boolean
    rules?: RegisterOptions
    errorMessage?: string
    name?: string
    control?: Control<any>
    containerClassName?: string
    notInFuture?: boolean
    beforeField?: string | string[]
    afterField?: string | string[]
    beforeFieldError?: string
    afterFieldError?: string
    highlightMessage?: string
}

function BsDatePicker({
    label,
    isRequired,
    rules,
    errorMessage,
    name: fieldName,
    control,
    containerClassName,
    notInFuture,
    beforeField,
    afterField,
    beforeFieldError,
    afterFieldError,
    showTime,
    fieldHighlight,
    highlightMessage,
    ...coreProps
}: BsDatePickerFieldProps) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const [isOpen, setIsOpen] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const resolvedMaxValue =
        coreProps.maxValue ??
        (notInFuture
            ? showTime
                ? now(getLocalTimeZone()).toString().substring(0, 16)
                : today(getLocalTimeZone()).toString()
            : undefined)

    const renderContent = (field?: any, fieldState?: any) => {
        const hasError = !!(fieldState?.error || errorMessage || coreProps.isInvalid)
        const errorMsg = fieldState?.error?.message || errorMessage
        const activeHighlight = !hasError ? fieldHighlight : undefined

        const bindProps: any = field
            ? {
                  value: field.value,
                  onChange: (v: string) => {
                      field.onChange(v)
                      coreProps.onChange?.(v)
                  },
              }
            : {}

        return (
            <div className={cn('group/field w-full relative', containerClassName)}>
                {label && (
                    <Label
                        data-invalid={hasError ? true : undefined}
                        className={cn(
                            'mb-0! transition-colors relative flex items-center gap-1 w-fit max-w-full overflow-hidden',
                            isFocused || isOpen ? 'text-primary' : '',
                            hasError && 'text-destructive!',
                            activeHighlight && getFieldHighlightLabelClass(activeHighlight),
                        )}
                    >
                        <span className="truncate min-w-0" title={label}>
                            {label}
                        </span>
                        {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
                    </Label>
                )}
                <BsDatePickerCore
                    {...coreProps}
                    showTime={showTime}
                    minValue={coreProps.minValue ?? '1900-01-01'}
                    maxValue={resolvedMaxValue}
                    {...bindProps}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    isInvalid={hasError}
                    fieldHighlight={activeHighlight}
                />
                {errorMsg && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}
                {!errorMsg && highlightMessage && activeHighlight && (
                    <p className={cn('text-xs mt-1', getFieldHighlightMessageClass(activeHighlight))}>
                        {highlightMessage}
                    </p>
                )}
            </div>
        )
    }

    if (fieldName && resolvedControl) {
        const { validate: rulesValidate, ...restRules } = rules || {}

        const customValidate =
            typeof rulesValidate === 'function'
                ? { custom: rulesValidate }
                : rulesValidate && typeof rulesValidate === 'object'
                  ? rulesValidate
                  : {}

        const autoRules = {
            ...(isRequired
                ? {
                      required: t('forms.validation.required', { label: label ?? t('common.field') }),
                  }
                : {}),
            validate: {
                minDate: (value: string) => {
                    if (!value) return true
                    const minStr = coreProps.minValue ?? '1900-01-01'
                    const compareValue = value.substring(0, showTime ? 16 : 10)
                    return compareValue >= minStr || t('forms.validation.minDate1900', { label })
                },
                ...(notInFuture
                    ? {
                          notInFuture: (value: string) => {
                              if (!value) return true
                              const nowStr = (showTime ? now(getLocalTimeZone()) : today(getLocalTimeZone()))
                                  .toString()
                                  .substring(0, showTime ? 16 : 10)
                              const compareValue = value.substring(0, showTime ? 16 : 10)
                              return compareValue <= nowStr || t('forms.validation.notInFuture', { label })
                          },
                      }
                    : {}),
                ...(beforeField
                    ? {
                          beforeField: (value: string) => {
                              if (!value || !formContext) return true
                              const targetFields = Array.isArray(beforeField) ? beforeField : [beforeField]
                              const isValid = targetFields.every(targetField => {
                                  const targetValue = formContext.watch(targetField)
                                  if (!targetValue) return true
                                  return value <= targetValue
                              })
                              return isValid || beforeFieldError || t('forms.validation.beforeExpiry', { label })
                          },
                      }
                    : {}),
                ...(afterField
                    ? {
                          afterField: (value: string) => {
                              if (!value || !formContext) return true
                              const targetFields = Array.isArray(afterField) ? afterField : [afterField]
                              const isValid = targetFields.every(targetField => {
                                  const targetValue = formContext.watch(targetField)
                                  if (!targetValue) return true
                                  return value >= targetValue
                              })
                              return isValid || afterFieldError || t('forms.validation.afterIssue', { label })
                          },
                      }
                    : {}),
                ...customValidate,
            },
            ...restRules,
        }

        return (
            <Controller
                name={fieldName}
                control={resolvedControl}
                rules={autoRules}
                render={({ field, fieldState }) => renderContent(field, fieldState)}
            />
        )
    }

    return renderContent()
}

function BsDateRangePickerCore({
    value: controlledValue,
    onChange: controlledOnChange,
    defaultValue,
    minValue,
    maxValue,
    className,
    isDisabled,
    isOpen,
    setIsOpen,
    isFocused,
    setIsFocused,
    isInvalid,
    ...props
}: BsDateRangePickerProps & {
    isOpen?: boolean
    setIsOpen?: (open: boolean) => void
    isFocused?: boolean
    setIsFocused?: (focused: boolean) => void
    isInvalid?: boolean
}) {
    const [uncontrolledValue, uncontrolledOnChange] = React.useState<BsDateRangePickerValue | undefined>(defaultValue)
    const value = controlledValue ?? uncontrolledValue
    const onChange = controlledOnChange ?? uncontrolledOnChange

    const isMobile = useIsMobile()
    const months = isMobile ? 1 : 2

    return (
        <DateRangePicker
            aria-label="Date Range Picker"
            isInvalid={isInvalid || (props as any)['aria-invalid']}
            className={composeRenderProps(className, className => cn('w-full', className))}
            value={value?.start && value?.end ? { start: parseDate(value.start), end: parseDate(value.end) } : null}
            onChange={value =>
                onChange?.({
                    start: value?.start?.toString() ?? '',
                    end: value?.end?.toString() ?? '',
                })
            }
            minValue={minValue ? parseDate(minValue) : null}
            maxValue={maxValue ? parseDate(maxValue) : null}
            isDisabled={isDisabled}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            onFocusChange={setIsFocused}
            {...props}
        >
            <FieldGroup isInvalid={isInvalid} className="h-8 px-2 gap-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="-ml-1 shrink-0 data-[focus-visible]:ring-offset-0"
                    excludeFromTabOrder
                >
                    <CalendarIcon
                        aria-hidden
                        className={cn(
                            'size-4 text-muted-foreground transition-colors',
                            isFocused && 'text-primary',
                            isInvalid && 'text-destructive',
                        )}
                    />
                </Button>
                <DateInput
                    className={cn(!value?.start && isDisabled && '[&_span]:text-transparent! text-transparent!')}
                    variant="ghost"
                    slot={'start'}
                    isInvalid={isInvalid}
                    isFocused={isFocused}
                />
                <ArrowRight
                    aria-hidden
                    className={cn(
                        'size-3 text-muted-foreground opacity-50 mx-0.5 flex-shrink-0',
                        !value?.start && !value?.end && isDisabled && 'text-transparent! opacity-0',
                    )}
                />
                <DateInput
                    className={cn(
                        'flex-1',
                        !value?.end && isDisabled && '[&_span]:text-transparent! text-transparent!',
                    )}
                    variant="ghost"
                    slot={'end'}
                    isInvalid={isInvalid}
                    isFocused={isFocused}
                />
                {(value?.start || value?.end) && !isDisabled && (
                    <Button
                        slot={null as any}
                        variant="ghost"
                        size="iconSm"
                        className="-mr-1"
                        onPress={() => {
                            onChange?.({ start: '', end: '' })
                        }}
                        excludeFromTabOrder
                    >
                        <X className={getIconColorClass(isInvalid)} />
                    </Button>
                )}
            </FieldGroup>
            <DatePickerContent>
                <RangeCalendar visibleDuration={{ months }}>
                    <CalendarHeading />
                    <div className="flex gap-3 items-start">
                        {Array.from({ length: months }).map((_, index) => (
                            <CalendarGrid key={index} offset={{ months: index }}>
                                <CalendarGridHeader>
                                    {day => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                                </CalendarGridHeader>
                                <CalendarGridBody>{date => <CalendarCell date={date} type="range" />}</CalendarGridBody>
                            </CalendarGrid>
                        ))}
                    </div>
                </RangeCalendar>
            </DatePickerContent>
        </DateRangePicker>
    )
}

type BsDateRangePickerFieldProps = BsDateRangePickerProps & {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
    rules?: RegisterOptions
    containerClassName?: string
}

function BsDateRangePicker({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    rules,
    containerClassName,
    ...coreProps
}: BsDateRangePickerFieldProps) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const [isOpen, setIsOpen] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const renderContent = (field?: any, fieldState?: any) => {
        const hasError = !!(fieldState?.error || errorMessage || coreProps.isInvalid)
        const errorMsg = fieldState?.error?.message || errorMessage

        const bindProps: any = field
            ? {
                  value: field.value,
                  onChange: (v: any) => {
                      field.onChange(v)
                      coreProps.onChange?.(v)
                  },
              }
            : {}

        return (
            <div className={cn('group/field w-full', containerClassName)}>
                {label && (
                    <Label
                        data-invalid={hasError ? true : undefined}
                        className={cn(
                            'mb-0! transition-colors relative flex items-center gap-1 w-fit max-w-full overflow-hidden',
                            isFocused || isOpen ? 'text-primary' : '',
                            hasError && 'text-destructive!',
                        )}
                    >
                        <span className="truncate min-w-0" title={label}>
                            {label}
                        </span>
                        {isRequired && <span className="text-destructive flex-shrink-0">*</span>}
                    </Label>
                )}
                <BsDateRangePickerCore
                    {...coreProps}
                    minValue={coreProps.minValue ?? '1900-01-01'}
                    {...bindProps}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    isInvalid={hasError}
                />
                {errorMsg && <div className="text-destructive text-[11px] mt-1">{errorMsg}</div>}
            </div>
        )
    }

    if (fieldName && resolvedControl) {
        const { validate: rulesValidate, ...restRules } = rules || {}

        const customValidate =
            typeof rulesValidate === 'function'
                ? { custom: rulesValidate }
                : rulesValidate && typeof rulesValidate === 'object'
                  ? rulesValidate
                  : {}

        const autoRules = {
            ...(isRequired
                ? {
                      required: t('forms.validation.required', { label: label ?? t('common.field') }),
                  }
                : {}),
            validate: {
                rangeOrder: (value?: { start?: string; end?: string }) => {
                    if (!value?.start || !value?.end) return true
                    return value.start <= value.end || t('forms.validation.rangeInvalid')
                },
                ...customValidate,
            },
            ...restRules,
        }

        return (
            <Controller
                name={fieldName}
                control={resolvedControl}
                rules={autoRules}
                render={({ field, fieldState }) => renderContent(field, fieldState)}
            />
        )
    }

    return renderContent()
}

export { BsDatePicker, BsDateRangePicker, DatePicker, DatePickerContent, DateRangePicker }
