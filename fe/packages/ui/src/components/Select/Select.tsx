'use client'

import { CheckIcon, ChevronDownIcon, ChevronRightIcon, XIcon, Boxes, Folder } from 'lucide-react'
import React from 'react'
import type { Key, ListBoxItemProps, PopoverProps, Selection } from 'react-aria-components'
import {
    Select,
    Autocomplete,
    Input,
    TextField,
    ListBox,
    ListBoxItem,
    SelectValue,
    useFilter,
    SelectStateContext,
} from 'react-aria-components'
import { cn } from '@workspace/ui/lib/utils'
import { Button } from '@workspace/ui/components/Button'
import { Popover } from '@workspace/ui/components/Popover'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { Badge } from '@workspace/ui/components/Badge'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { useTranslation } from 'react-i18next'
import { Controller, useFormContext, type RegisterOptions } from 'react-hook-form'
import { Label } from '@workspace/ui/components/Field'
import {
    getFieldHighlightControlClass,
    getFieldHighlightLabelClass,
    getFieldHighlightMessageClass,
} from '@workspace/ui/lib/fieldHighlight'

import type { BsSelectMappedOption, BsSelectProps, BsSelectFieldProps, BsTreeSelectNode } from './Select.types'
import { usePopoverScrollTracking } from './Select.hooks'

// Flatten tree to options for react-aria
function flattenTree(nodes: BsTreeSelectNode[], level = 0): BsSelectMappedOption[] {
    const result: BsSelectMappedOption[] = []
    for (const node of nodes) {
        result.push({ id: node.id, name: node.name, _level: level, _type: node.type } as any)
        if (node.children?.length) {
            result.push(...flattenTree(node.children, level + 1))
        }
    }
    return result
}

// Find selected node name from tree
function findNodeName(nodes: BsTreeSelectNode[], id: string | number): string | null {
    for (const node of nodes) {
        if (String(node.id) === String(id)) return node.name
        if (node.children?.length) {
            const found = findNodeName(node.children, id)
            if (found) return found
        }
    }
    return null
}

function toSelectedKeys(
    selectionMode: 'single' | 'multiple',
    selectedValue: string | number | null | undefined,
    selectedValues: 'all' | Iterable<string | number> | undefined,
    options: BsSelectMappedOption[],
): Key[] | undefined {
    if (selectionMode === 'multiple') {
        if (selectedValues === undefined) return undefined
        return selectedValues === 'all' ? options.map(o => o.id) : Array.from(selectedValues)
    }
    if (selectedValue === undefined) return undefined
    return selectedValue == null || selectedValue === '' ? [] : [selectedValue]
}

const normalizeLabelForPlaceholder = (label?: string) => {
    if (!label) return label
    const trimmed = label.trim()
    if (!trimmed) return ''
    return trimmed.toLocaleLowerCase('vi-VN')
}

export function BsSelectCore<
    T extends Record<string, any> = BsSelectMappedOption,
    M extends 'single' | 'multiple' = 'single',
>({
    options,
    treeData,
    isTree,
    valueKey: vKey = 'id',
    labelKey: lKey = 'name',
    valueMode = 'simple',
    selectedValue,
    selectedValues,
    defaultSelectedValue,
    renderOption,
    renderValue,
    isClearable = true,
    maxVisibleBadges = 2,
    placeholder,
    isSearchable = false,
    popoverClassName,
    popoverPlacement,
    className,
    emptyMessage,
    skipTranslation = false,
    onChange,
    isOpen: controlledIsOpen,
    setIsOpen: controlledSetIsOpen,
    isFocused,
    setIsFocused,
    fieldHighlight,
    autoFocus,
    ...props
}: BsSelectProps<T, M>) {
    const { t } = useTranslation()
    const resolvedPlaceholder = placeholder ?? t('common.select')
    const resolvedEmptyMessage = emptyMessage ?? t('common.noResultsFound')

    const [isOpenState, setIsOpenState] = React.useState(false)
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpenState
    const setIsOpen = controlledSetIsOpen !== undefined ? controlledSetIsOpen : setIsOpenState

    const [searchQuery, setSearchQuery] = React.useState('')
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

    const selectionMode = props.selectionMode ?? 'single'
    const selectRef = React.useRef<HTMLDivElement>(null)
    usePopoverScrollTracking(selectRef, isOpen ?? false)

    // Build options from treeData if isTree
    const flatOptions = React.useMemo(() => {
        if (isTree && treeData?.length) {
            return flattenTree(treeData)
        }
        return options ? Array.from(options) : []
    }, [isTree, treeData, options])

    // Map external options to internal format for react-aria
    const { mappedOptions, optionMap, optionKeySet } = React.useMemo(() => {
        const arr = flatOptions
        const map = new Map<string | number, T>()
        const keySet = new Set<string>()
        const mapped: BsSelectMappedOption[] = arr.map((opt: any) => {
            const id = opt[vKey] as string | number
            map.set(id, opt as T)
            keySet.add(String(id))
            const labelValue = String(opt[lKey])
            return { id, name: skipTranslation ? labelValue : t(labelValue as any) }
        })
        return { mappedOptions: mapped, optionMap: map, optionKeySet: keySet }
    }, [flatOptions, vKey, lKey, t, skipTranslation])

    const orphanSingleValue = React.useMemo(() => {
        if (selectionMode !== 'single') return null
        if (selectedValue == null || selectedValue === '') return null
        return optionKeySet.has(String(selectedValue)) ? null : String(selectedValue)
    }, [selectionMode, selectedValue, optionKeySet])

    const orphanMultipleValues = React.useMemo(() => {
        if (selectionMode !== 'multiple' || !selectedValues || selectedValues === 'all') return [] as string[]
        return Array.from(selectedValues)
            .filter(v => v != null && v !== '' && !optionKeySet.has(String(v)))
            .map(v => String(v))
    }, [selectionMode, selectedValues, optionKeySet])

    // Filter tree based on search
    const filteredTree = React.useMemo(() => {
        if (!isTree || !treeData?.length || !searchQuery) return treeData

        const filterNodes = (nodes: BsTreeSelectNode[]): BsTreeSelectNode[] => {
            return nodes
                .filter(node => node.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(node => ({
                    ...node,
                    children: node.children ? filterNodes(node.children) : undefined,
                }))
        }
        return filterNodes(treeData)
    }, [isTree, treeData, searchQuery])

    // Get selected label
    const selectedLabel = React.useMemo(() => {
        if (!selectedValue || !isTree || !treeData?.length) return null
        return findNodeName(treeData, selectedValue)
    }, [selectedValue, isTree, treeData])

    // Intercept onChange to emit based on valueMode
    const handleSelectionChange = React.useCallback(
        (key: any) => {
            if (!onChange) return

            if (valueMode === 'object') {
                if (selectionMode === 'multiple') {
                    if (key === 'all') {
                        onChange(Array.from(optionMap.values()))
                    } else {
                        const keys = Array.from(key as Iterable<string | number>)
                        onChange(keys.map(k => optionMap.get(k)).filter(Boolean))
                    }
                } else {
                    onChange(key != null ? (optionMap.get(key) ?? null) : null)
                }
            } else {
                onChange(key)
            }
            // Close popover on select for tree mode
            if (isTree) {
                setIsOpen?.(false)
            }
        },
        [onChange, valueMode, optionMap, selectionMode, isTree, setIsOpen],
    )

    if (isSearchable && !isTree) {
        return (
            <InlineSearchSelect<T>
                items={mappedOptions}
                optionMap={optionMap}
                selectionMode={selectionMode}
                selectedKeys={toSelectedKeys(selectionMode, selectedValue, selectedValues, mappedOptions)}
                defaultSelectedKeys={defaultSelectedValue !== undefined ? [defaultSelectedValue] : []}
                onSelectionChange={handleSelectionChange}
                placeholder={resolvedPlaceholder}
                emptyMessage={resolvedEmptyMessage}
                isDisabled={!!props.isDisabled}
                isInvalid={!!(props.isInvalid || (props as any)['aria-invalid'])}
                isClearable={isClearable}
                maxVisibleBadges={maxVisibleBadges}
                renderValue={renderValue}
                renderOption={renderOption}
                fieldHighlight={fieldHighlight}
                isOpen={!!isOpen}
                setIsOpen={setIsOpen}
                setIsFocused={setIsFocused}
                autoFocus={autoFocus}
                className={className}
                popoverClassName={popoverClassName}
                popoverPlacement={popoverPlacement}
                ariaLabel={(props as any)['aria-label'] ?? 'Select'}
            />
        )
    }

    const handleToggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Build selection props conditionally
    const selectionProps: Record<string, any> = { onChange: handleSelectionChange }
    if (selectionMode === 'multiple') {
        if (selectedValues !== undefined) selectionProps.value = selectedValues
    } else {
        if (selectedValue !== undefined) selectionProps.value = selectedValue
    }
    if (defaultSelectedValue !== undefined) selectionProps.defaultValue = defaultSelectedValue

    return (
        <div ref={selectRef}>
            <Select<BsSelectMappedOption, M>
                isOpen={isOpen}
                onOpenChange={open => {
                    setIsOpen?.(open)
                }}
                aria-label="Select"
                isInvalid={(props as any)['aria-invalid']}
                onFocusChange={setIsFocused}
                className={cn('w-full relative', className)}
                {...props}
                {...selectionProps}
            >
                {state => {
                    const hasValue =
                        selectedValue != null || (Array.isArray(selectedValues) && selectedValues.length > 0)

                    return (
                        <div className="group/select relative w-full">
                            <Button
                                autoFocus={autoFocus}
                                variant="outline"
                                className={cn(
                                    'justify-between w-full pr-2 h-8 py-1.5 font-normal text-start ring-inset transition-all shadow-sm rounded-sm',
                                    'border-0 ring ring-input bg-background md:text-sm',
                                    state.isFocused ? 'ring-primary ring-2 bg-primary/5' : '',
                                    state.isInvalid
                                        ? 'ring-2! ring-destructive! border-transparent! bg-destructive/10!'
                                        : fieldHighlight
                                          ? getFieldHighlightControlClass(fieldHighlight)
                                          : '',
                                    'hover:bg-muted/40',
                                    'disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground',
                                )}
                            >
                                <SelectValue<BsSelectMappedOption> className="truncate">
                                    {({ isPlaceholder, selectedItems }) => {
                                        const renderPlaceholder = () => {
                                            if (props.isDisabled || !resolvedPlaceholder) {
                                                return (
                                                    <div className="opacity-0" aria-hidden="true">
                                                        &nbsp;
                                                    </div>
                                                )
                                            }
                                            return (
                                                <div
                                                    className={cn(
                                                        'text-muted-foreground transition-colors',
                                                        state.isFocused && 'text-primary/60',
                                                        state.isInvalid && 'text-destructive/60',
                                                    )}
                                                >
                                                    {resolvedPlaceholder}
                                                </div>
                                            )
                                        }

                                        if (selectionMode === 'multiple') {
                                            const knownItems = (selectedItems ?? []).filter(Boolean)
                                            if (knownItems.length === 0 && orphanMultipleValues.length === 0) {
                                                return renderPlaceholder()
                                            }

                                            const visibleKnown = knownItems.slice(0, maxVisibleBadges)
                                            const remainingSlots = Math.max(0, maxVisibleBadges - visibleKnown.length)
                                            const visibleOrphans = orphanMultipleValues.slice(0, remainingSlots)
                                            const hiddenCount =
                                                knownItems.length +
                                                orphanMultipleValues.length -
                                                visibleKnown.length -
                                                visibleOrphans.length

                                            return (
                                                <div className="flex-1 flex gap-1 flex-nowrap overflow-hidden truncate">
                                                    {visibleKnown.map(item => {
                                                        const original = optionMap.get(item!.id)

                                                        return (
                                                            <Badge
                                                                key={item!.id}
                                                                variant="secondary"
                                                                className="pr-0.5 grid grid-cols-[1fr_16px] flex-shrink-0"
                                                            >
                                                                <div className="truncate text-[11px]">
                                                                    {renderValue && original
                                                                        ? renderValue(original as T)
                                                                        : item!.name}
                                                                </div>
                                                                <BadgeClearButton data={item!} />
                                                            </Badge>
                                                        )
                                                    })}

                                                    {visibleOrphans.map(code => (
                                                        <Badge
                                                            key={code}
                                                            variant="secondary"
                                                            className="pr-1.5 flex-shrink-0"
                                                        >
                                                            <span className="truncate text-[11px]" title={code}>
                                                                {code}
                                                            </span>
                                                        </Badge>
                                                    ))}

                                                    {hiddenCount > 0 && (
                                                        <Badge variant="secondary" className="flex-shrink-0">
                                                            <span className="text-[11px]">{`+${hiddenCount}`}</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            )
                                        }

                                        if (orphanSingleValue) {
                                            return (
                                                <div className="truncate" title={orphanSingleValue}>
                                                    {orphanSingleValue}
                                                </div>
                                            )
                                        }
                                        if (isPlaceholder) return renderPlaceholder()

                                        const selectedItem = selectedItems[0]
                                        if (!selectedItem) return null

                                        if (isTree && selectedLabel) {
                                            if (renderValue) {
                                                const original = optionMap.get(selectedItem.id)
                                                return original ? renderValue(original as T) : selectedLabel
                                            }
                                            return selectedLabel
                                        }

                                        if (renderValue) {
                                            const original = optionMap.get(selectedItem.id)
                                            return original ? renderValue(original as T) : selectedItem.name
                                        }
                                        return selectedItem.name
                                    }}
                                </SelectValue>
                                <ChevronDownIcon
                                    className={cn(
                                        'w-4 h-4 text-muted-foreground transition-opacity',
                                        state.isInvalid ? 'text-destructive!' : '',
                                        state.isFocused ? 'text-primary' : '',
                                        isClearable && hasValue && !(props as any).isDisabled
                                            ? 'group-hover/select:opacity-0'
                                            : '',
                                    )}
                                />
                            </Button>
                            {isClearable && (
                                <SelectClearButton
                                    isDisabled={!!(props as any).isDisabled}
                                    isFocused={state.isFocused}
                                    isInvalid={state.isInvalid}
                                />
                            )}
                            <Popover
                                placement={popoverPlacement}
                                shouldAllowBackgroundScroll
                                isOpen={isOpen}
                                onOpenChange={setIsOpen}
                                className={cn(
                                    '!max-h-[350px] min-w-(--trigger-width) w-max max-w-[500px] flex flex-col p-1 gap-0',
                                    popoverClassName,
                                )}
                            >
                                {isTree ? (
                                    // Tree mode - custom rendering, not using react-aria ListBox
                                    <div className="flex flex-col h-full">
                                        {isSearchable && (
                                            <div className="pb-2">
                                                <BsSearchField
                                                    value={searchQuery}
                                                    onChange={setSearchQuery}
                                                    placeholder="Search..."
                                                    containerClassName="w-full"
                                                />
                                            </div>
                                        )}
                                        <ScrollArea className="flex-1 scrollbar-hide">
                                            <div className="p-1">
                                                {filteredTree?.map(node => (
                                                    <TreeNodeComponent
                                                        key={String(node.id)}
                                                        node={node}
                                                        level={0}
                                                        expandedIds={expandedIds}
                                                        selectedValue={selectedValue}
                                                        onToggleExpand={handleToggleExpand}
                                                        onSelect={(id, _name) => {
                                                            handleSelectionChange(id)
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    // Normal mode
                                    <ListBox
                                        items={mappedOptions}
                                        className="outline-hidden overflow-x-hidden overflow-y-auto flex-1 scroll-pb-1 w-full scrollbar-hide"
                                        renderEmptyState={() => {
                                            return (
                                                <div className="text-muted-foreground text-sm text-center h-8 flex items-center justify-center">
                                                    {resolvedEmptyMessage}
                                                </div>
                                            )
                                        }}
                                    >
                                        {item => {
                                            const original = optionMap.get(item.id)
                                            return (
                                                <BsSelectItem
                                                    renderOption={
                                                        renderOption && original
                                                            ? () => renderOption(original as T)
                                                            : undefined
                                                    }
                                                >
                                                    {item.name}
                                                </BsSelectItem>
                                            )
                                        }}
                                    </ListBox>
                                )}
                            </Popover>
                        </div>
                    )
                }}
            </Select>
        </div>
    )
}

export function BsSelect<
    T extends Record<string, any> = BsSelectMappedOption,
    M extends 'single' | 'multiple' = 'single',
>({
    label,
    isRequired,
    errorMessage,
    name: fieldName,
    control,
    rules,
    containerClassName,
    fieldHighlight,
    highlightMessage,
    ...coreProps
}: BsSelectFieldProps<T, M>) {
    const { t } = useTranslation()
    const resolvedPlaceholder =
        coreProps.placeholder ??
        t('forms.placeholder.select', { label: normalizeLabelForPlaceholder(label ?? t('common.field')) })
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const [isOpen, setIsOpen] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const selMode = coreProps.selectionMode ?? 'single'
    const valMode = coreProps.valueMode ?? 'simple'
    const vk = coreProps.valueKey ?? 'id'

    const renderContent = (field?: any, fieldState?: any) => {
        const hasError = !!(fieldState?.error || errorMessage)
        const errorMsg = fieldState?.error?.message || errorMessage
        const activeHighlight = !hasError ? fieldHighlight : undefined

        let bindProps: any = {}
        if (field) {
            if (selMode === 'multiple') {
                bindProps = {
                    selectedValues:
                        valMode === 'object'
                            ? Array.isArray(field.value)
                                ? field.value.map((d: any) => d[vk])
                                : []
                            : field.value,
                    onChange: (value: any) => {
                        if (valMode === 'object') {
                            field.onChange(value)
                        } else {
                            if (value === 'all') {
                                const opts = coreProps.options ? Array.from(coreProps.options) : []
                                field.onChange(opts.map((o: any) => String(o[vk])))
                            } else {
                                field.onChange(Array.from(value as Iterable<string>))
                            }
                        }
                        coreProps.onChange?.(value)
                    },
                }
            } else {
                const rawValue = valMode === 'object' ? (field.value?.[vk] ?? field.value) : field.value
                bindProps = {
                    selectedValue: rawValue === undefined || rawValue === '' ? null : rawValue,
                    onChange: (value: any) => {
                        field.onChange(value)
                        coreProps.onChange?.(value)
                    },
                }
            }
        }

        return (
            <div className={cn('group/field relative', containerClassName)}>
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
                <BsSelectCore<T, M>
                    {...coreProps}
                    isOpen={isOpen}
                    setIsOpen={setIsOpen}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    placeholder={resolvedPlaceholder}
                    fieldHighlight={activeHighlight}
                    {...bindProps}
                    isInvalid={hasError}
                    aria-invalid={hasError}
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
        const mergedRules = {
            ...(isRequired
                ? {
                      required: t('forms.validation.required', { label: label ?? t('common.field') }),
                  }
                : {}),
            ...(rules ?? {}),
        } as RegisterOptions

        return (
            <Controller
                name={fieldName}
                control={resolvedControl}
                rules={mergedRules}
                render={({ field, fieldState }) => renderContent(field, fieldState)}
            />
        )
    }

    return renderContent()
}

function BsSelectItem(
    props: ListBoxItemProps & {
        children: string
        renderOption?: () => React.ReactNode
    },
) {
    return (
        <ListBoxItem
            {...props}
            textValue={props.children}
            className={cn(
                'cursor-pointer group flex items-center justify-between select-none py-1.5 px-4 outline-hidden rounded-sm text-popover-foreground transition-colors w-full',
                'data-[focus-visible]:bg-neutral-500/15 data-focused:bg-primary! data-focused:text-white!',
            )}
        >
            {({ isSelected }) => (
                <>
                    <div
                        className="text-sm font-normal group-selected:font-medium min-w-0 truncate text-start"
                        title={props.children}
                    >
                        {props.renderOption ? props.renderOption() : props.children}
                    </div>
                    {isSelected && (
                        <div className="flex shrink-0 items-center justify-center text-primary-foreground group-data-focused:text-white/90 ml-4">
                            <CheckIcon size={14} />
                        </div>
                    )}
                </>
            )}
        </ListBoxItem>
    )
}

// Tree node component for tree select mode
function TreeNodeComponent({
    node,
    level,
    expandedIds,
    selectedValue,
    onToggleExpand,
    onSelect,
}: {
    node: BsTreeSelectNode
    level: number
    expandedIds: Set<string>
    selectedValue: string | number | null | undefined
    onToggleExpand: (id: string) => void
    onSelect: (id: string | number, name: string) => void
}) {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedIds.has(String(node.id))
    const isSelected = String(selectedValue) === String(node.id)

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer',
                    isSelected && 'bg-primary/10',
                )}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={() => onSelect(node.id, node.name)}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation()
                            onToggleExpand(String(node.id))
                        }}
                        className="p-0.5 hover:bg-muted rounded"
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="size-4 text-muted-foreground" />
                        ) : (
                            <ChevronRightIcon className="size-4 text-muted-foreground" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {node.type === 'R' ? (
                    <Boxes className="size-4 text-red-500" />
                ) : (
                    <Folder className="size-4 text-amber-500" />
                )}

                <span className="text-sm flex-1">{node.name}</span>
                {node.type && (
                    <span className="text-xs text-muted-foreground">[{node.type === 'R' ? 'Module' : 'Nhóm'}]</span>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map(child => (
                        <TreeNodeComponent
                            key={String(child.id)}
                            node={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            selectedValue={selectedValue}
                            onToggleExpand={onToggleExpand}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function SelectClearButton({
    isDisabled = false,
    isFocused = false,
    isInvalid = false,
}: {
    isDisabled?: boolean
    isFocused?: boolean
    isInvalid?: boolean
}) {
    const state = React.useContext(SelectStateContext)
    const value = state?.value as string | Array<number | string>

    if (!value || value.length === 0 || isDisabled) return null

    return (
        <div
            role="button"
            tabIndex={-1}
            onClick={e => {
                e.stopPropagation()
                state?.setValue(null)
            }}
            className={cn(
                'size-6! flex items-center justify-center z-10 rounded bg-transparent text-muted-foreground hover:bg-neutral-400/15',
                'absolute right-1 top-1/2 -translate-y-1/2',
                'transition-all opacity-0 group-hover/select:opacity-100',
                isFocused ? 'text-primary' : '',
                isInvalid ? 'text-destructive!' : '',
            )}
        >
            <XIcon className="size-3.5" />
        </div>
    )
}

function BadgeClearButton({ data }: { data: BsSelectMappedOption }) {
    const state = React.useContext(SelectStateContext)
    const value = state?.value as string | Array<number | string>

    if (!Array.isArray(value)) return null

    return (
        <div
            role="button"
            tabIndex={-1}
            className="size-4! flex items-center justify-center z-10 rounded bg-transparent hover:bg-neutral-400/15"
            onClick={e => {
                e.stopPropagation()
                const newKeys = value.filter(v => v !== data.id)
                state?.setValue(newKeys)
            }}
        >
            <XIcon className="size-2.5!" />
        </div>
    )
}

interface InlineSearchSelectProps<T> {
    items: BsSelectMappedOption[]
    optionMap: Map<string | number, T>
    selectionMode: 'single' | 'multiple'
    selectedKeys?: Key[]
    defaultSelectedKeys: Key[]
    onSelectionChange: (value: any) => void
    placeholder?: string
    emptyMessage?: string
    isDisabled: boolean
    isInvalid: boolean
    isClearable: boolean
    maxVisibleBadges: number
    renderValue?: (value: T) => React.ReactNode
    renderOption?: (item: T) => React.ReactNode
    fieldHighlight?: BsSelectProps['fieldHighlight']
    isOpen: boolean
    setIsOpen?: (open: boolean) => void
    setIsFocused?: (focused: boolean) => void
    autoFocus?: boolean
    className?: string
    popoverClassName?: string
    popoverPlacement?: PopoverProps['placement']
    ariaLabel: string
}

function InlineSearchSelect<T>({
    items,
    optionMap,
    selectionMode,
    selectedKeys: controlledKeys,
    defaultSelectedKeys,
    onSelectionChange,
    placeholder,
    emptyMessage,
    isDisabled,
    isInvalid,
    isClearable,
    maxVisibleBadges,
    renderValue,
    renderOption,
    fieldHighlight,
    isOpen,
    setIsOpen,
    setIsFocused,
    autoFocus,
    className,
    popoverClassName,
    popoverPlacement,
    ariaLabel,
}: InlineSearchSelectProps<T>) {
    const { contains } = useFilter({ sensitivity: 'base' })
    const triggerRef = React.useRef<HTMLDivElement>(null)
    const popoverRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = React.useState('')
    const [hasFocus, setHasFocus] = React.useState(false)
    const [innerKeys, setInnerKeys] = React.useState<Key[]>(defaultSelectedKeys)
    const [triggerWidth, setTriggerWidth] = React.useState<number>()

    const isMultiple = selectionMode === 'multiple'
    const open = isOpen && !isDisabled
    const itemByKey = React.useMemo(() => new Map(items.map(item => [String(item.id), item])), [items])
    const keys = (controlledKeys ?? innerKeys).map(k => itemByKey.get(String(k))?.id ?? k)

    const knownItems = keys.map(k => itemByKey.get(String(k))).filter(Boolean) as BsSelectMappedOption[]
    const orphanKeys = keys.filter(k => k != null && k !== '' && !itemByKey.has(String(k))).map(String)
    const hasValue = knownItems.length + orphanKeys.length > 0

    const setOpen = React.useCallback((next: boolean) => setIsOpen?.(next), [setIsOpen])

    const commit = (next: Key[]) => {
        if (controlledKeys === undefined) setInnerKeys(next)
        onSelectionChange(isMultiple ? new Set(next) : (next[0] ?? null))
    }

    const handleListSelection = (selection: Selection) => {
        if (selection === 'all') {
            commit(items.map(i => i.id))
        } else if (isMultiple) {
            commit(Array.from(selection))
        } else {
            const [first] = Array.from(selection)
            if (first !== undefined) commit([first])
            setOpen(false)
        }
        setInputValue('')
    }

    const removeKey = (key: Key) => commit(keys.filter(k => String(k) !== String(key)))

    React.useEffect(() => {
        if (!open) return
        const isInside = (target: EventTarget | null) =>
            target instanceof Node && (triggerRef.current?.contains(target) || popoverRef.current?.contains(target))
        const closeIfOutside = (e: Event) => {
            if (!isInside(e.target)) setOpen(false)
        }
        document.addEventListener('pointerdown', closeIfOutside, true)
        document.addEventListener('scroll', closeIfOutside, true)
        return () => {
            document.removeEventListener('pointerdown', closeIfOutside, true)
            document.removeEventListener('scroll', closeIfOutside, true)
        }
    }, [open, setOpen])

    React.useLayoutEffect(() => {
        const el = triggerRef.current
        if (!open || !el) return
        const observer = new ResizeObserver(() => setTriggerWidth(el.offsetWidth))
        observer.observe(el)
        return () => observer.disconnect()
    }, [open])

    const keepFocus = (e: React.MouseEvent) => e.preventDefault()

    const renderLabel = (item: BsSelectMappedOption) => {
        const original = optionMap.get(item.id)
        return renderValue && original ? renderValue(original) : item.name
    }

    const visibleKnown = knownItems.slice(0, maxVisibleBadges)
    const visibleOrphans = orphanKeys.slice(0, Math.max(0, maxVisibleBadges - visibleKnown.length))
    const hiddenCount = knownItems.length + orphanKeys.length - visibleKnown.length - visibleOrphans.length

    const singleLabel = !isMultiple ? (knownItems[0] ? renderLabel(knownItems[0]) : orphanKeys[0]) : null
    const showPlaceholder = !hasValue && !isDisabled

    return (
        <Autocomplete
            filter={contains}
            inputValue={inputValue}
            onInputChange={value => {
                setInputValue(value)
                if (!open) setOpen(true)
            }}
        >
            <div ref={triggerRef} className={cn('group/select relative w-full', className)}>
                <div
                    onMouseDown={e => {
                        if (isDisabled) return
                        if (e.target !== inputRef.current) e.preventDefault()
                        inputRef.current?.focus()
                        setOpen(!open || e.target === inputRef.current)
                    }}
                    className={cn(
                        'flex items-center gap-1 w-full pl-3 pr-2 h-8 rounded-sm text-sm cursor-text overflow-hidden',
                        'ring ring-inset ring-input bg-background shadow-sm transition-all hover:bg-muted/40',
                        hasFocus || open ? 'ring-primary ring-2 bg-primary/5' : '',
                        isInvalid
                            ? 'ring-2! ring-destructive! bg-destructive/10!'
                            : fieldHighlight
                              ? getFieldHighlightControlClass(fieldHighlight)
                              : '',
                        isDisabled && 'bg-muted! text-muted-foreground cursor-default hover:bg-muted',
                    )}
                >
                    {isMultiple && (
                        <div className="flex gap-1 flex-nowrap min-w-0 shrink overflow-hidden">
                            {visibleKnown.map(item => (
                                <Badge
                                    key={String(item.id)}
                                    variant="secondary"
                                    className="pr-0.5 grid grid-cols-[minmax(0,1fr)_16px] shrink min-w-12 max-w-28"
                                >
                                    <div className="truncate text-[11px]" title={item.name}>
                                        {renderLabel(item)}
                                    </div>
                                    {!isDisabled && (
                                        <div
                                            role="button"
                                            tabIndex={-1}
                                            aria-label="Remove"
                                            onMouseDown={keepFocus}
                                            onClick={e => {
                                                e.stopPropagation()
                                                removeKey(item.id)
                                            }}
                                            className="size-4! flex items-center justify-center z-10 rounded bg-transparent hover:bg-neutral-400/15"
                                        >
                                            <XIcon className="size-2.5!" />
                                        </div>
                                    )}
                                </Badge>
                            ))}
                            {visibleOrphans.map(code => (
                                <Badge key={code} variant="secondary" className="pr-1.5 flex-shrink-0">
                                    <span className="truncate text-[11px]" title={code}>
                                        {code}
                                    </span>
                                </Badge>
                            ))}
                            {hiddenCount > 0 && (
                                <Badge variant="secondary" className="flex-shrink-0">
                                    <span className="text-[11px]">{`+${hiddenCount}`}</span>
                                </Badge>
                            )}
                        </div>
                    )}
                    <div className="relative flex-1 min-w-[3ch] h-full flex items-center">
                        {!isMultiple && singleLabel != null && inputValue === '' && (
                            <div
                                className={cn(
                                    'absolute inset-0 flex items-center truncate pointer-events-none',
                                    open && 'text-muted-foreground',
                                )}
                            >
                                <span className="truncate">{singleLabel}</span>
                            </div>
                        )}
                        <TextField aria-label={ariaLabel} isDisabled={isDisabled} className="w-full">
                            <Input
                                ref={inputRef}
                                autoFocus={autoFocus}
                                placeholder={showPlaceholder ? placeholder : undefined}
                                onFocus={() => {
                                    setHasFocus(true)
                                    setIsFocused?.(true)
                                }}
                                onBlur={e => {
                                    if (popoverRef.current?.contains(e.relatedTarget as Node)) return
                                    setHasFocus(false)
                                    setIsFocused?.(false)
                                    setOpen(false)
                                    setInputValue('')
                                }}
                                onKeyDown={e => {
                                    if (e.nativeEvent.isComposing) return
                                    if (e.key === 'Enter') e.preventDefault()
                                    if (e.key === 'Backspace' && inputValue === '' && isMultiple && keys.length) {
                                        removeKey(keys[keys.length - 1]!)
                                    } else if ((e.key === 'ArrowDown' || e.key === 'Enter') && !open) {
                                        setOpen(true)
                                    } else if (e.key === 'Escape' && open) {
                                        setOpen(false)
                                    } else if (e.key === 'Tab') {
                                        setOpen(false)
                                    }
                                }}
                                className={cn(
                                    'w-full h-full bg-transparent border-0 p-0 outline-none text-sm truncate',
                                    'placeholder:text-muted-foreground disabled:cursor-default',
                                    hasFocus && 'placeholder:text-primary/60',
                                    isInvalid && 'placeholder:text-destructive/60',
                                )}
                            />
                        </TextField>
                    </div>
                    <ChevronDownIcon
                        className={cn(
                            'w-4 h-4 shrink-0 text-muted-foreground transition-opacity',
                            isInvalid ? 'text-destructive!' : '',
                            hasFocus ? 'text-primary' : '',
                            isClearable && hasValue && !isDisabled ? 'group-hover/select:opacity-0' : '',
                        )}
                    />
                </div>
                {isClearable && hasValue && !isDisabled && (
                    <div
                        role="button"
                        tabIndex={-1}
                        aria-label="Clear"
                        onMouseDown={keepFocus}
                        onClick={e => {
                            e.stopPropagation()
                            commit([])
                            setInputValue('')
                        }}
                        className={cn(
                            'size-6! flex items-center justify-center z-10 rounded bg-transparent text-muted-foreground hover:bg-neutral-400/15',
                            'absolute right-1 top-1/2 -translate-y-1/2',
                            'transition-all opacity-0 group-hover/select:opacity-100',
                            hasFocus ? 'text-primary' : '',
                            isInvalid ? 'text-destructive!' : '',
                        )}
                    >
                        <XIcon className="size-3.5" />
                    </div>
                )}
            </div>
            <Popover
                ref={popoverRef}
                triggerRef={triggerRef}
                isOpen={open}
                onOpenChange={setOpen}
                isNonModal
                shouldAllowBackgroundScroll
                placement={popoverPlacement ?? 'bottom start'}
                style={{ '--trigger-width': triggerWidth ? `${triggerWidth}px` : undefined } as React.CSSProperties}
                className={cn(
                    '!max-h-[350px] min-w-(--trigger-width) w-max max-w-[500px] flex flex-col p-1 gap-0',
                    popoverClassName,
                )}
            >
                <div onMouseDown={keepFocus} className="flex flex-col min-h-0 flex-1">
                    <ListBox
                        aria-label={ariaLabel}
                        items={items}
                        selectionMode={selectionMode}
                        selectedKeys={keys}
                        escapeKeyBehavior="none"
                        onSelectionChange={handleListSelection}
                        className="outline-hidden overflow-x-hidden overflow-y-auto flex-1 scroll-pb-1 w-full scrollbar-hide"
                        renderEmptyState={() => (
                            <EmptyState kind="no-match" variant="compact" title={emptyMessage} className="py-3" />
                        )}
                    >
                        {item => {
                            const original = optionMap.get(item.id)
                            return (
                                <BsSelectItem
                                    renderOption={renderOption && original ? () => renderOption(original) : undefined}
                                >
                                    {item.name}
                                </BsSelectItem>
                            )
                        }}
                    </ListBox>
                </div>
            </Popover>
        </Autocomplete>
    )
}
