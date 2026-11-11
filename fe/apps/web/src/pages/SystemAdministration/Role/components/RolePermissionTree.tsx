import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useFormContext, Controller, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
    ChevronDown,
    ChevronRight,
    ListFilter,
    CheckSquare,
    Square,
    ChevronFirst,
    ChevronLast,
    Lock,
    Zap,
} from 'lucide-react'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { Button } from '@workspace/ui/components/Button'
import { Separator } from '@workspace/ui/components/Separator'
import { BsSearchField as SearchField } from '@workspace/ui/components/Searchfield'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'

import { buildPermissionTree } from '../../Permission/services/mapper'
import type { PermissionTreeNode, PermissionResponse } from '../../Permission/types'
import { getIcon } from '../../Permission/utils/constants'
import { cn } from '@workspace/ui/lib/utils'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import { PermissionTypeEnum } from '@/constants/options'

interface RolePermissionTreeProps {
    permissions: PermissionResponse[]
    isDisabled?: boolean
}

export const RolePermissionTree = ({ permissions, isDisabled }: RolePermissionTreeProps) => {
    const { t } = useTranslation()
    const { control, setValue, getValues } = useFormContext()
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')

    const tree = useMemo(() => (permissions ? buildPermissionTree(permissions) : []), [permissions])

    // Map & leaf code precomputation in a single loop
    const { permissionMap, permissionCodeMap, leafCodes } = useMemo(() => {
        const pMap = new Map<string, PermissionResponse>()
        const cMap = new Map<string, PermissionResponse>()
        const parentCodes = new Set<string>()

        if (permissions) {
            permissions.forEach(p => {
                pMap.set(p.id, p)
                cMap.set(p.code, p)
                if (p.parentCode) {
                    parentCodes.add(p.parentCode)
                }
            })
        }

        const leaves = new Set<string>()
        if (permissions) {
            permissions.forEach(p => {
                if (!parentCodes.has(p.code)) {
                    leaves.add(p.id)
                }
            })
        }

        return { permissionMap: pMap, permissionCodeMap: cMap, leafCodes: leaves }
    }, [permissions])

    // Precompute leaf descendant IDs for each node in the tree to optimize render performance
    const nodeLeavesMap = useMemo(() => {
        const map = new Map<string, string[]>()

        const getLeaves = (n: PermissionTreeNode): string[] => {
            if (map.has(n.id)) return map.get(n.id)!

            const leaves: string[] = []
            const hasChildren = n.children && n.children.length > 0
            if (!hasChildren) {
                leaves.push(n.id)
            } else {
                n.children?.forEach(child => {
                    leaves.push(...getLeaves(child))
                })
            }
            map.set(n.id, leaves)
            return leaves
        }

        tree.forEach(getLeaves)
        return map
    }, [tree])

    // Complete selected set with ancestors (optimized with early break)
    const getCompleteIds = useCallback(
        (leafIds: Set<string>): Set<string> => {
            const completed = new Set<string>()
            leafIds.forEach(id => {
                let current = permissionMap.get(id)
                while (current && !completed.has(current.id)) {
                    completed.add(current.id)
                    if (current.parentCode) {
                        current = permissionCodeMap.get(current.parentCode)
                    } else {
                        current = undefined
                    }
                }
            })
            return completed
        },
        [permissionMap, permissionCodeMap],
    )

    const permissionIds = useWatch({
        control,
        name: 'permissionIds',
    })

    // Stable selectedSet to prevent child re-renders
    const selectedSet = useMemo(() => new Set((permissionIds as string[]) || []), [permissionIds])

    // Automatically complete ancestor IDs on initialization or value changes
    useEffect(() => {
        if (!permissions || permissions.length === 0 || !permissionIds) return
        const currentIds = permissionIds as string[]
        const currentLeafIds = new Set<string>()
        currentIds.forEach(id => {
            if (leafCodes.has(id)) {
                currentLeafIds.add(id)
            }
        })
        const completed = getCompleteIds(currentLeafIds)
        const isDifferent =
            completed.size !== currentIds.length || Array.from(completed).some(id => !currentIds.includes(id))

        if (isDifferent) {
            setValue('permissionIds', Array.from(completed), { shouldValidate: true })
        }
    }, [permissions, leafCodes, getCompleteIds, permissionIds, setValue])

    const filteredTree = useMemo(() => {
        if (!searchTerm) return tree

        const term = searchTerm.toLowerCase().trim()
        const filterNodes = (nodes: PermissionTreeNode[]): PermissionTreeNode[] => {
            return nodes
                .map(node => {
                    const children = node.children ? filterNodes(node.children) : []
                    const matches = node.name.toLowerCase().includes(term) || node.code.toLowerCase().includes(term)
                    if (matches || children.length > 0) {
                        return { ...node, children }
                    }
                    return null
                })
                .filter(Boolean) as PermissionTreeNode[]
        }
        return filterNodes(tree)
    }, [tree, searchTerm])

    const toggleExpand = useCallback((code: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev)
            if (next.has(code)) next.delete(code)
            else next.add(code)
            return next
        })
    }, [])

    const handleExpandAll = useCallback(() => {
        if (!permissions) return
        setExpandedNodes(new Set(permissions.map(p => p.code)))
    }, [permissions])

    const handleCollapseAll = useCallback(() => {
        setExpandedNodes(new Set())
    }, [])

    const handleSelect = useCallback(
        (node: PermissionTreeNode, isChecked: boolean) => {
            if (isDisabled) return

            const currentIds = (getValues('permissionIds') as string[]) || []
            const currentLeafIds = new Set<string>()
            currentIds.forEach(id => {
                if (leafCodes.has(id)) {
                    currentLeafIds.add(id)
                }
            })

            const leaves = nodeLeavesMap.get(node.id) || []
            if (isChecked) {
                leaves.forEach(id => currentLeafIds.add(id))
            } else {
                leaves.forEach(id => currentLeafIds.delete(id))
            }

            const newSelectedIds = getCompleteIds(currentLeafIds)
            setValue('permissionIds', Array.from(newSelectedIds), {
                shouldValidate: true,
                shouldDirty: true,
            })
        },
        [isDisabled, leafCodes, nodeLeavesMap, getCompleteIds, getValues, setValue],
    )

    const handleSelectAll = useCallback(() => {
        if (!permissions || isDisabled) return
        setValue(
            'permissionIds',
            permissions.map(p => p.id),
            {
                shouldValidate: true,
                shouldDirty: true,
            },
        )
    }, [permissions, isDisabled, setValue])

    const handleDeselectAll = useCallback(() => {
        if (isDisabled) return
        setValue('permissionIds', [], {
            shouldValidate: true,
            shouldDirty: true,
        })
    }, [isDisabled, setValue])

    return (
        <Controller
            name="permissionIds"
            control={control}
            rules={{
                validate: (ids: string[]) => (ids?.length || 0) > 0 || t('role.errors.permissionRequired'),
            }}
            render={({ fieldState }) => {
                return (
                    <div className="col-span-3 space-y-1">
                        <div
                            className={cn(
                                'border rounded-sm overflow-hidden bg-background flex flex-col transition-all',
                                fieldState.error ? 'border-destructive ring-2 ring-destructive ring-inset' : '',
                            )}
                        >
                            <div
                                className={cn(
                                    'px-3 py-2 flex items-center justify-between border-b transition-colors',
                                    fieldState.error ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30',
                                )}
                            >
                                <div
                                    className={cn(
                                        'text-xs font-semibold uppercase tracking-wider flex items-center gap-2',
                                        fieldState.error ? 'text-destructive' : 'text-muted-foreground',
                                    )}
                                >
                                    <ListFilter className="size-3.5" />
                                    <span>
                                        {t('role.title.list')}
                                        <span className="text-destructive ml-1">*</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', fieldState.error && 'text-destructive')}
                                        onPress={handleSelectAll}
                                        isDisabled={isDisabled}
                                    >
                                        <CheckSquare className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', fieldState.error && 'text-destructive')}
                                        onPress={handleDeselectAll}
                                        isDisabled={isDisabled}
                                    >
                                        <Square className="size-3.5" />
                                    </Button>
                                    <Separator
                                        orientation="vertical"
                                        className={cn('h-4 mx-1', fieldState.error && 'bg-destructive/30')}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', fieldState.error && 'text-destructive')}
                                        onPress={handleExpandAll}
                                    >
                                        <ChevronLast className="size-3.5 rotate-90" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn('size-7', fieldState.error && 'text-destructive')}
                                        onPress={handleCollapseAll}
                                    >
                                        <ChevronFirst className="size-3.5 rotate-90" />
                                    </Button>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    'p-2 border-b transition-colors',
                                    fieldState.error && 'border-destructive/20',
                                )}
                            >
                                <SearchField
                                    placeholder={t('common.search')}
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    className="h-8 text-xs"
                                    isInvalid={!!fieldState.error}
                                />
                            </div>

                            <ScrollArea className="h-[400px] p-1 min-h-[100px]">
                                {filteredTree.length > 0 ? (
                                    filteredTree.map(node => (
                                        <PermissionItem
                                            key={node.code}
                                            node={node}
                                            level={0}
                                            expandedNodes={expandedNodes}
                                            selectedSet={selectedSet}
                                            onToggle={toggleExpand}
                                            onSelect={handleSelect}
                                            isDisabled={isDisabled}
                                            nodeLeavesMap={nodeLeavesMap}
                                        />
                                    ))
                                ) : (
                                    <EmptyState
                                        tone={fieldState.error ? 'destructive' : 'default'}
                                        className="h-full min-h-[300px] animate-in fade-in zoom-in-95 duration-300"
                                    />
                                )}
                            </ScrollArea>
                        </div>
                        {fieldState.error && (
                            <p className="text-xs text-destructive mt-1 font-medium animate-in fade-in slide-in-from-top-1">
                                {fieldState.error.message}
                            </p>
                        )}
                    </div>
                )
            }}
        />
    )
}

interface PermissionItemProps {
    node: PermissionTreeNode
    level: number
    expandedNodes: Set<string>
    selectedSet: Set<string>
    onToggle: (code: string) => void
    onSelect: (node: PermissionTreeNode, isSelected: boolean) => void
    isDisabled?: boolean
    nodeLeavesMap: Map<string, string[]>
}

const PermissionItem = React.memo(
    ({
        node,
        level,
        expandedNodes,
        selectedSet,
        onToggle,
        onSelect,
        isDisabled,
        nodeLeavesMap,
    }: PermissionItemProps) => {
        const { t } = useTranslation()
        const isExpanded = expandedNodes.has(node.code)
        const hasChildren = node.children && node.children.length > 0

        const { isSelected, isIndeterminate } = useMemo(() => {
            if (!hasChildren) {
                return {
                    isSelected: selectedSet.has(node.id),
                    isIndeterminate: false,
                }
            }

            const leaves = nodeLeavesMap.get(node.id) || []
            let selectedCount = 0
            leaves.forEach(id => {
                if (selectedSet.has(id)) {
                    selectedCount++
                }
            })

            const allSelected = selectedCount === leaves.length && leaves.length > 0
            const someSelected = selectedCount > 0 && !allSelected

            return {
                isSelected: allSelected,
                isIndeterminate: someSelected,
            }
        }, [hasChildren, node.id, nodeLeavesMap, selectedSet])

        return (
            <div className="select-none">
                <div
                    className={cn(
                        'flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-sm transition-colors group',
                        isIndeterminate && 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
                    )}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                >
                    <div className="flex items-center gap-1 min-w-[24px]">
                        {hasChildren && (
                            <button
                                type="button"
                                onClick={() => onToggle(node.code)}
                                className="p-0.5 hover:bg-muted rounded text-inherit transition-transform duration-200"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="size-3.5" />
                                ) : (
                                    <ChevronRight className="size-3.5" />
                                )}
                            </button>
                        )}
                    </div>
                    <Checkbox
                        isSelected={isSelected}
                        isIndeterminate={isIndeterminate}
                        onChange={isChecked => onSelect(node, isChecked)}
                        isDisabled={isDisabled}
                        className="size-4"
                    />
                    <span
                        className="text-sm cursor-pointer flex-1 truncate"
                        onClick={() => !isDisabled && onSelect(node, !isSelected)}
                    >
                        {node.name}
                    </span>

                    <div className="text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                        {getIcon(node.type)}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="flex flex-col">
                        {(() => {
                            const children = node.children!
                            const isMenuOrPage =
                                node.type === PermissionTypeEnum.MENU || node.type === PermissionTypeEnum.PAGE

                            if (!isMenuOrPage) {
                                return children.map(child => (
                                    <PermissionItem
                                        key={child.code}
                                        node={child}
                                        level={level + 1}
                                        expandedNodes={expandedNodes}
                                        selectedSet={selectedSet}
                                        onToggle={onToggle}
                                        onSelect={onSelect}
                                        isDisabled={isDisabled}
                                        nodeLeavesMap={nodeLeavesMap}
                                    />
                                ))
                            }

                            const functions = children.filter(c => c.type === PermissionTypeEnum.FUNCTION)
                            const apis = children.filter(c => c.type === PermissionTypeEnum.API)
                            const others = children.filter(
                                c => c.type !== PermissionTypeEnum.FUNCTION && c.type !== PermissionTypeEnum.API,
                            )

                            return (
                                <React.Fragment>
                                    {others.map(child => (
                                        <PermissionItem
                                            key={child.code}
                                            node={child}
                                            level={level + 1}
                                            expandedNodes={expandedNodes}
                                            selectedSet={selectedSet}
                                            onToggle={onToggle}
                                            onSelect={onSelect}
                                            isDisabled={isDisabled}
                                            nodeLeavesMap={nodeLeavesMap}
                                        />
                                    ))}

                                    {functions.length > 0 && (
                                        <div className="flex flex-col">
                                            <div
                                                className="flex items-center gap-2 px-2 py-1 mt-1 opacity-80"
                                                style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                                            >
                                                <Zap className="size-3 text-green-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-600/80">
                                                    {t('permission.typeLabels.functions', 'Chức năng')}
                                                </span>
                                            </div>
                                            {functions.map(child => (
                                                <PermissionItem
                                                    key={child.code}
                                                    node={child}
                                                    level={level + 1}
                                                    expandedNodes={expandedNodes}
                                                    selectedSet={selectedSet}
                                                    onToggle={onToggle}
                                                    onSelect={onSelect}
                                                    isDisabled={isDisabled}
                                                    nodeLeavesMap={nodeLeavesMap}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {apis.length > 0 && (
                                        <div className="flex flex-col">
                                            <div
                                                className="flex items-center gap-2 px-2 py-1 mt-1 opacity-80"
                                                style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}
                                            >
                                                <Lock className="size-3 text-purple-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600/80">
                                                    {t('permission.typeLabels.apis', 'APIs')}
                                                </span>
                                            </div>
                                            {apis.map(child => (
                                                <PermissionItem
                                                    key={child.code}
                                                    node={child}
                                                    level={level + 1}
                                                    expandedNodes={expandedNodes}
                                                    selectedSet={selectedSet}
                                                    onToggle={onToggle}
                                                    onSelect={onSelect}
                                                    isDisabled={isDisabled}
                                                    nodeLeavesMap={nodeLeavesMap}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </React.Fragment>
                            )
                        })()}
                    </div>
                )}
            </div>
        )
    },
)

PermissionItem.displayName = 'PermissionItem'
