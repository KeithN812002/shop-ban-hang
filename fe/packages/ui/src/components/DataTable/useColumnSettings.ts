import React from 'react'
import type { ColumnPinningState, ColumnSizingState, VisibilityState } from '@tanstack/react-table'
import {
    clearColumnSettings,
    readColumnSettings,
    readTableDensity,
    writeColumnSettings,
    writeTableDensity,
    type TableDensity,
} from './columnSettingsStorage'

const MIN_COLUMN_WIDTH = 60

interface UseColumnSettingsOptions {
    columnIds: string[]
    columnPinning?: ColumnPinningState
    columnSettingsKey?: string
    persistColumnSettings: boolean
}

/**
 * Column order / visibility / pinning / width and row density for DataTable, remembered on this device.
 * Settings are written only after a user change and cleared by resetColumnSettings.
 */
export function useColumnSettings({
    columnIds,
    columnPinning,
    columnSettingsKey,
    persistColumnSettings,
}: UseColumnSettingsOptions) {
    const defaultColumnPinning = React.useMemo<ColumnPinningState>(
        () => columnPinning || { right: ['actions'] },
        [columnPinning],
    )
    const [columnOrder, setColumnOrder] = React.useState<string[]>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnPinningState, setColumnPinningState] = React.useState<ColumnPinningState>(defaultColumnPinning)
    const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
    const [resizingColumnId, setResizingColumnId] = React.useState<string | null>(null)
    const [density, setDensityState] = React.useState<TableDensity>(readTableDensity)
    const setDensity = React.useCallback((next: TableDensity) => {
        setDensityState(next)
        writeTableDensity(next)
    }, [])
    const settingsChangedRef = React.useRef(false)
    const loadedSettingsKeyRef = React.useRef<string | null | undefined>(undefined)
    const stopResizeRef = React.useRef<(() => void) | null>(null)

    const columnIdsSignature = columnIds.join('|')
    const settingsStorageKey = persistColumnSettings
        ? (columnSettingsKey ??
          `${typeof window === 'undefined' ? '' : window.location.pathname}:${[...columnIds].sort().join(',')}`)
        : null

    React.useEffect(() => {
        if (!columnIdsSignature || loadedSettingsKeyRef.current === settingsStorageKey) return
        loadedSettingsKeyRef.current = settingsStorageKey
        settingsChangedRef.current = false

        const ids = columnIdsSignature.split('|')
        const saved = settingsStorageKey ? readColumnSettings(settingsStorageKey) : null
        if (!saved) {
            setColumnOrder(prev => (prev.length ? prev : ids))
            return
        }

        const known = new Set(ids)
        const keepKnown = (list?: string[]) => (list ?? []).filter(id => known.has(id))
        setColumnOrder([...keepKnown(saved.order), ...ids.filter(id => !saved.order.includes(id))])
        setColumnVisibility(Object.fromEntries(Object.entries(saved.visibility).filter(([id]) => known.has(id))))
        setColumnPinningState({ left: keepKnown(saved.pinning.left), right: keepKnown(saved.pinning.right) })
        setColumnSizing(Object.fromEntries(Object.entries(saved.sizing).filter(([id]) => known.has(id))))
    }, [settingsStorageKey, columnIdsSignature])

    React.useEffect(() => {
        if (!settingsStorageKey || !settingsChangedRef.current || resizingColumnId || columnOrder.length === 0) return
        writeColumnSettings(settingsStorageKey, {
            order: columnOrder,
            visibility: columnVisibility,
            pinning: columnPinningState,
            sizing: columnSizing,
        })
    }, [settingsStorageKey, columnOrder, columnVisibility, columnPinningState, columnSizing, resizingColumnId])

    React.useEffect(() => () => stopResizeRef.current?.(), [])

    const markSettingsChanged =
        <T>(setter: (updater: T) => void) =>
        (updater: T) => {
            settingsChangedRef.current = true
            setter(updater)
        }

    const resetColumnSettings = () => {
        setColumnVisibility({})
        setColumnSizing({})
        setColumnPinningState(defaultColumnPinning)
        setColumnOrder(columnIds)
        settingsChangedRef.current = false
        if (settingsStorageKey) clearColumnSettings(settingsStorageKey)
    }

    const startColumnResize = (event: React.PointerEvent<HTMLElement>, columnId: string) => {
        const th = event.currentTarget.closest('th')
        if (!th) return
        event.preventDefault()
        event.stopPropagation()
        const startX = event.clientX
        const startWidth = th.getBoundingClientRect().width
        setResizingColumnId(columnId)

        const onMove = (moveEvent: PointerEvent) => {
            const width = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + moveEvent.clientX - startX))
            settingsChangedRef.current = true
            setColumnSizing(prev => (prev[columnId] === width ? prev : { ...prev, [columnId]: width }))
        }
        const stop = () => {
            setResizingColumnId(null)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', stop)
            window.removeEventListener('pointercancel', stop)
            stopResizeRef.current = null
        }
        stopResizeRef.current?.()
        stopResizeRef.current = stop
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', stop)
        window.addEventListener('pointercancel', stop)
    }

    const resetColumnWidth = (columnId: string) => {
        settingsChangedRef.current = true
        setColumnSizing(prev => {
            const { [columnId]: _removed, ...rest } = prev
            return rest
        })
    }

    return {
        defaultColumnPinning,
        columnOrder,
        columnVisibility,
        columnPinningState,
        columnSizing,
        density,
        setDensity,
        resizingColumnId,
        onColumnOrderChange: markSettingsChanged(setColumnOrder),
        onColumnVisibilityChange: markSettingsChanged(setColumnVisibility),
        onColumnPinningChange: markSettingsChanged(setColumnPinningState),
        resetColumnSettings,
        startColumnResize,
        resetColumnWidth,
    }
}
