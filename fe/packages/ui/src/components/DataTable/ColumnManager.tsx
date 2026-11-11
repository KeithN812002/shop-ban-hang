import { useDragAndDrop } from 'react-aria-components'
import { LayoutGrid, Pin, PinOff, RotateCcw, Settings } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { GridList, GridListItem } from '@workspace/ui/components/GridList'
import { Popover, PopoverDialog, PopoverTrigger } from '@workspace/ui/components/Popover'
import { cn } from '@workspace/ui/lib/utils'
import type { TableDensity } from './columnSettingsStorage'

const DENSITY_OPTIONS: TableDensity[] = ['compact', 'normal', 'comfortable']

export function ColumnManager({ table, translate }: { table: any; translate: (key: string) => string }) {
    const { dragAndDropHooks } = useDragAndDrop({
        getItems: keys => [...keys].map(key => ({ 'text/plain': String(key) })),
        onReorder(e) {
            const items = [...e.keys] as string[]
            const targetKey = e.target.key as string
            const { columnOrder } = table.getState()

            // Handle empty state gracefully by falling back to the current leaf columns order
            const currentOrder =
                columnOrder.length > 0 ? columnOrder : table.getAllLeafColumns().map((c: any) => c.id as string)

            const newOrder = [...currentOrder].filter((key: string) => !items.includes(key))
            const targetIndex = newOrder.indexOf(targetKey)

            if (e.target.dropPosition === 'before') {
                newOrder.splice(targetIndex, 0, ...items)
            } else {
                newOrder.splice(targetIndex + 1, 0, ...items)
            }

            table.setColumnOrder(newOrder)
        },
    })

    const { columnOrder } = table.getState()
    const columns = table.getAllLeafColumns().filter((col: any) => col.id !== 'actions')

    // Sort columns based on current order for display
    const sortedColumns = [...columns].sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.id)
        const bIndex = columnOrder.indexOf(b.id)
        return aIndex - bIndex
    })

    return (
        <PopoverTrigger>
            <Button
                variant="ghost"
                className="w-full h-full rounded-none flex items-center justify-center hover:bg-accent/50 group-data-[state=open]:bg-accent transition-colors"
                style={{ minHeight: '40px' }}
            >
                <Settings className="size-4 text-primary" />
            </Button>
            <Popover placement="bottom end" className="w-72 p-0">
                <PopoverDialog className="p-0">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                            <LayoutGrid className="size-4 text-primary" />
                            {translate('common.tableSettings') || 'Settings'}
                        </div>
                        <Button
                            variant="ghost"
                            size="iconSm"
                            onPress={() => table.options.meta?.resetColumnSettings?.()}
                            className="size-7 rounded-full opacity-60 hover:opacity-100 hover:bg-neutral-500/20 transition-all font-bold"
                            aria-label={translate('common.reset')}
                        >
                            <RotateCcw className="size-4" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            {translate('common.tableDensity.label')}
                        </span>
                        <div className="flex rounded-md border p-0.5">
                            {DENSITY_OPTIONS.map(option => (
                                <Button
                                    key={option}
                                    variant={table.options.meta?.density === option ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onPress={() => table.options.meta?.setDensity?.(option)}
                                >
                                    {translate(`common.tableDensity.${option}`)}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto py-1 pl-1 scrollbar-float">
                        <GridList
                            items={sortedColumns.map(c => ({ id: c.id, column: c }))}
                            dragAndDropHooks={dragAndDropHooks}
                            aria-label="Column management"
                            className="border-none shadow-none bg-transparent gap-0"
                        >
                            {item => {
                                const column = item.column
                                const isPinned = column.getIsPinned()
                                const canPin = column.getCanPin()

                                let label = column.id
                                if (typeof column.columnDef.header === 'string') {
                                    label = column.columnDef.header
                                } else if (column.id === 'select') {
                                    label = translate('common.select')
                                }

                                return (
                                    <GridListItem
                                        id={item.id}
                                        className="flex items-center justify-between px-2 py-1.5 hover:bg-accent/30 rounded-md group/item transition-colors border-none outline-none data-[focused]:bg-accent/50 data-[selected]:bg-accent/50"
                                    >
                                        <div className="flex flex-1 items-center gap-2 min-w-0 pointer-events-none">
                                            <Checkbox
                                                isSelected={column.getIsVisible()}
                                                onChange={value => column.toggleVisibility(!!value)}
                                                aria-label={`Toggle ${label}`}
                                                className="pointer-events-auto"
                                            />
                                            <span className="text-sm truncate opacity-80 group-hover/item:opacity-100 italic transition-opacity">
                                                {label}
                                            </span>
                                        </div>
                                        {canPin && (
                                            <div className="flex items-center gap-1 ml-2 pointer-events-auto">
                                                <Button
                                                    variant={isPinned ? 'secondary' : 'ghost'}
                                                    size="iconSm"
                                                    className={cn(
                                                        'size-7 rounded-full transition-all',
                                                        isPinned
                                                            ? 'opacity-100 hover:bg-neutral-500/20'
                                                            : 'opacity-30 hover:opacity-100',
                                                    )}
                                                    onPress={() => column.pin(isPinned ? false : 'left')}
                                                    aria-label={isPinned ? 'Unpin column' : 'Pin column'}
                                                >
                                                    {isPinned ? (
                                                        <PinOff className="size-3.5 text-foreground" />
                                                    ) : (
                                                        <Pin className="size-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </GridListItem>
                                )
                            }}
                        </GridList>
                    </div>
                </PopoverDialog>
            </Popover>
        </PopoverTrigger>
    )
}
