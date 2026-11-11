'use client'

import React, { useMemo, useState, useCallback, type ComponentType } from 'react'
import { ChevronsRight, ChevronsLeft, UserCog, type LucideProps } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext } from 'react-hook-form'

import { cn } from '@workspace/ui/lib/utils'
import { EmptyState } from '../EmptyState/EmptyState'
import { Button } from '@workspace/ui/components/Button'
import { GridList, GridListItem } from '@workspace/ui/components/GridList'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'
import { Label } from '@workspace/ui/components/Field'

export interface TransferItem {
    id: string | number
    name: string
    [key: string]: any
}

type TransferKey<T> = Extract<keyof T, string | number>
type TransferIcon = ComponentType<LucideProps>

interface TransferProps<T extends TransferItem> {
    items: T[]
    selectedValues?: (string | number)[]
    onChange?: (values: (string | number)[]) => void
    labelKey?: TransferKey<T>
    valueKey?: TransferKey<T>
    titleAvailable?: string
    titleSelected?: string
    className?: string
    isDisabled?: boolean
    isInvalid?: boolean
    errorMessage?: string
    initialValues?: (string | number)[]
    isRequired?: boolean
    /** Panel header + row icon. Defaults to UserCog so existing screens stay unchanged. */
    icon?: TransferIcon
}

interface TransferPanelProps<T extends TransferItem> {
    title: string
    count: number
    items: T[]
    search: string
    onSearchChange: (val: string) => void
    onAction: (id: any) => void
    variant: 'available' | 'assigned'
    initialSet: Set<string>
    selectedSet: Set<string>
    valueKey: TransferKey<T>
    labelKey: TransferKey<T>
    isDisabled?: boolean
    isInvalid?: boolean
    isRequired?: boolean
    icon: TransferIcon
}

const TransferPanelContent = <T extends TransferItem>({
    title,
    count,
    items,
    search,
    onSearchChange,
    onAction,
    variant,
    initialSet,
    selectedSet,
    valueKey,
    labelKey,
    isDisabled,
    isInvalid,
    isRequired,
    icon: Icon,
}: TransferPanelProps<T>) => {
    const { t } = useTranslation()

    return (
        <div
            className={cn(
                'flex-1 flex flex-col rounded-sm h-[400px] overflow-hidden transition-all border',
                isInvalid
                    ? 'border-transparent ring-2 ring-destructive ring-inset bg-destructive/[0.02]'
                    : 'border-border bg-background',
            )}
        >
            <div
                className={cn(
                    'px-3 py-2 flex items-center justify-between border-b transition-colors',
                    isInvalid ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30',
                )}
            >
                <div
                    className={cn(
                        'text-xs font-semibold uppercase tracking-wider flex items-center gap-2',
                        isInvalid ? 'text-destructive' : 'text-muted-foreground',
                    )}
                >
                    <Icon className="size-3.5" />
                    <span>
                        {title}
                        {variant === 'assigned' && isRequired && <span className="text-destructive ml-1">*</span>}
                    </span>
                </div>
                <div
                    className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-background/50 border border-border/50',
                        isInvalid ? 'text-destructive border-destructive/30' : 'text-muted-foreground',
                    )}
                >
                    {count} {t('common.items', 'mục')}
                </div>
            </div>

            <div
                className={cn(
                    'p-2 border-b transition-colors',
                    isInvalid ? 'border-destructive/20' : 'border-border/50',
                )}
            >
                <BsSearchField
                    value={search}
                    onChange={onSearchChange}
                    placeholder={t('common.search', 'Tìm kiếm')}
                    containerClassName="w-full"
                    className="h-8 text-xs"
                    isInvalid={isInvalid}
                />
            </div>

            <ScrollArea className="flex-1 p-1 min-h-0">
                {items.length > 0 ? (
                    <GridList
                        aria-label={title}
                        items={items}
                        selectionMode="none"
                        onAction={onAction}
                        className="border-none shadow-none p-0 scrollbar-thin"
                    >
                        {item => {
                            const val = item[valueKey]
                            const idStr = String(val).trim()
                            const isOriginal = initialSet.has(idStr)
                            const isSelected = selectedSet.has(idStr)

                            const colorClass =
                                variant === 'available'
                                    ? isOriginal && !isSelected
                                        ? 'text-destructive'
                                        : 'text-foreground'
                                    : !isOriginal
                                      ? 'text-primary'
                                      : 'text-foreground'

                            return (
                                <GridListItem
                                    id={val as any}
                                    className={cn(
                                        'rounded-sm border-b border-border/40 last:border-0 transition-colors hover:bg-muted/40 cursor-pointer',
                                        colorClass,
                                        isDisabled && 'opacity-50 cursor-not-allowed',
                                    )}
                                >
                                    <div className="flex items-center gap-2 p-2">
                                        <Icon className="size-4 shrink-0 opacity-60" />
                                        <span className="text-sm truncate pr-2">{String(item[labelKey])}</span>
                                    </div>
                                </GridListItem>
                            )
                        }}
                    </GridList>
                ) : (
                    <EmptyState
                        tone={isInvalid ? 'destructive' : 'default'}
                        className="h-full min-h-[200px] animate-in fade-in zoom-in-95 duration-300"
                    />
                )}
            </ScrollArea>
        </div>
    )
}

const TransferPanel = React.memo(TransferPanelContent) as unknown as (<T extends TransferItem>(
    props: TransferPanelProps<T>,
) => React.ReactElement) & { displayName?: string }

TransferPanel.displayName = 'TransferPanel'

export function Transfer<T extends TransferItem>({
    items,
    selectedValues = [],
    onChange,
    labelKey = 'name' as TransferKey<T>,
    valueKey = 'id' as TransferKey<T>,
    titleAvailable,
    titleSelected,
    className,
    isDisabled,
    isInvalid,
    errorMessage,
    initialValues = [],
    isRequired,
    icon = UserCog,
}: TransferProps<T>) {
    const { t } = useTranslation()
    const [assignedSearch, setAssignedSearch] = useState('')
    const [availableSearch, setAvailableSearch] = useState('')

    const selectedSet = useMemo(() => new Set((selectedValues || []).map(v => String(v).trim())), [selectedValues])
    const initialSet = useMemo(() => new Set((initialValues || []).map(v => String(v).trim())), [initialValues])

    const { availableItems, assignedItems } = useMemo(() => {
        const available: T[] = []
        const assigned: T[] = []
        items.forEach(item => {
            const val = item[valueKey]
            if (selectedSet.has(String(val || '').trim())) {
                assigned.push(item)
            } else {
                available.push(item)
            }
        })
        return { availableItems: available, assignedItems: assigned }
    }, [items, selectedSet, valueKey])

    const filteredAvailable = useMemo(() => {
        const s = availableSearch.toLowerCase().trim()
        return s ? availableItems.filter(i => String(i[labelKey]).toLowerCase().includes(s)) : availableItems
    }, [availableItems, availableSearch, labelKey])

    const filteredAssigned = useMemo(() => {
        const s = assignedSearch.toLowerCase().trim()
        return s ? assignedItems.filter(i => String(i[labelKey]).toLowerCase().includes(s)) : assignedItems
    }, [assignedItems, assignedSearch, labelKey])

    const handleAssignAll = useCallback(() => {
        if (!isDisabled) onChange?.(Array.from(new Set(items.map(i => i[valueKey] as string | number))))
    }, [items, valueKey, onChange, isDisabled])

    const handleUnassignAll = useCallback(() => {
        if (!isDisabled) onChange?.([])
    }, [onChange, isDisabled])

    const handleAutoAssign = useCallback(
        (id: any) => {
            if (!isDisabled && onChange && !selectedSet.has(String(id).trim())) {
                onChange([...selectedValues, id])
            }
        },
        [isDisabled, onChange, selectedSet, selectedValues],
    )

    const handleAutoUnassign = useCallback(
        (id: any) => {
            if (!isDisabled && onChange) {
                const idStr = String(id).trim()
                onChange(selectedValues.filter(v => String(v).trim() !== idStr))
            }
        },
        [isDisabled, onChange, selectedValues],
    )

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex gap-4 items-stretch h-[400px]">
                <TransferPanel
                    title={titleAvailable ?? t('common.availableRoles', 'Có thể gán')}
                    count={filteredAvailable.length}
                    items={filteredAvailable}
                    search={availableSearch}
                    onSearchChange={setAvailableSearch}
                    onAction={handleAutoAssign}
                    variant="available"
                    initialSet={initialSet}
                    selectedSet={selectedSet}
                    valueKey={valueKey}
                    labelKey={labelKey}
                    isDisabled={isDisabled}
                    icon={icon}
                />
                <div className="flex flex-col justify-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onPress={handleAssignAll}
                        isDisabled={isDisabled || availableItems.length === 0}
                        aria-label={t('common.assignAll', 'Gán tất cả')}
                        className="rounded-full shadow-sm hover:bg-primary/20 shrink-0"
                    >
                        <ChevronsRight className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onPress={handleUnassignAll}
                        isDisabled={isDisabled || selectedValues.length === 0}
                        aria-label={t('common.unassignAll', 'Gỡ bỏ tất cả')}
                        className="rounded-full shadow-sm hover:bg-primary/20 shrink-0"
                    >
                        <ChevronsLeft className="size-4" />
                    </Button>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-h-0 h-[400px]">
                    <TransferPanel
                        title={titleSelected ?? t('common.assignedRoles', 'Đã gán')}
                        count={filteredAssigned.length}
                        items={filteredAssigned}
                        search={assignedSearch}
                        onSearchChange={setAssignedSearch}
                        onAction={handleAutoUnassign}
                        variant="assigned"
                        initialSet={initialSet}
                        selectedSet={selectedSet}
                        valueKey={valueKey}
                        labelKey={labelKey}
                        isDisabled={isDisabled}
                        isInvalid={isInvalid}
                        isRequired={isRequired}
                        icon={icon}
                    />
                    {isInvalid && errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
                </div>
            </div>
        </div>
    )
}

export interface BsTransferProps<T extends TransferItem> extends TransferProps<T> {
    name: string
    label?: string
    isRequired?: boolean
    rules?: any
    control?: any
    containerClassName?: string
}

export function BsTransfer<T extends TransferItem>({
    name,
    label,
    isRequired,
    rules,
    errorMessage,
    control,
    containerClassName,
    ...props
}: BsTransferProps<T>) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const renderLabel = (isInvalid?: boolean) => {
        if (!label) return null
        return (
            <Label className="mb-2 block">
                <span
                    className={cn(
                        'font-semibold transition-colors',
                        isInvalid ? 'text-destructive' : 'text-foreground',
                    )}
                >
                    {label}
                </span>
            </Label>
        )
    }

    if (name && resolvedControl) {
        return (
            <div className={cn('w-full', containerClassName)}>
                <Controller
                    name={name}
                    control={resolvedControl}
                    rules={{
                        ...(isRequired && {
                            required: t('forms.validation.required', { label: label ?? t('common.field') }),
                        }),
                        ...rules,
                    }}
                    render={({ field, fieldState }) => {
                        const errMsg = fieldState.error?.message || errorMessage
                        const isInvalid = !!errMsg
                        return (
                            <>
                                {renderLabel(isInvalid)}
                                <Transfer<T>
                                    {...props}
                                    selectedValues={field.value || []}
                                    onChange={val => {
                                        field.onChange(val)
                                        props.onChange?.(val)
                                    }}
                                    isInvalid={isInvalid}
                                    errorMessage={errMsg}
                                    isRequired={isRequired}
                                />
                            </>
                        )
                    }}
                />
            </div>
        )
    }

    return (
        <div className={cn('w-full', containerClassName)}>
            {renderLabel()}
            <Transfer<T> {...props} />
        </div>
    )
}
