'use client'

import { useState, useMemo } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Popover, PopoverTrigger } from '@workspace/ui/components/Popover'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'
import { ChevronRight, ChevronDown, FolderIcon, FileIcon, XIcon } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

interface TreeNode {
    id: string
    label: string
    children?: TreeNode[]
    icon?: React.ReactNode
}

const sampleTreeData: TreeNode[] = [
    {
        id: 'documents',
        label: 'Documents',
        children: [
            {
                id: 'work',
                label: 'Work',
                children: [
                    { id: 'reports', label: 'Reports' },
                    { id: 'presentations', label: 'Presentations' },
                    { id: 'spreadsheets', label: 'Spreadsheets' },
                ],
            },
            {
                id: 'personal',
                label: 'Personal',
                children: [
                    { id: 'photos', label: 'Photos' },
                    { id: 'videos', label: 'Videos' },
                ],
            },
        ],
    },
    {
        id: 'projects',
        label: 'Projects',
        children: [
            {
                id: 'web-dev',
                label: 'Web Development',
                children: [
                    { id: 'frontend', label: 'Frontend' },
                    { id: 'backend', label: 'Backend' },
                    { id: 'database', label: 'Database' },
                ],
            },
            {
                id: 'mobile',
                label: 'Mobile Apps',
                children: [
                    { id: 'ios', label: 'iOS' },
                    { id: 'android', label: 'Android' },
                ],
            },
        ],
    },
    {
        id: 'downloads',
        label: 'Downloads',
        children: [
            { id: 'images', label: 'Images' },
            { id: 'documents-dl', label: 'Documents' },
            { id: 'software', label: 'Software' },
        ],
    },
]

interface TreeSelectNodeProps {
    node: TreeNode
    level: number
    selectedIds: Set<string>
    expandedIds: Set<string>
    onToggleExpand: (id: string) => void
    onToggleSelect: (id: string) => void
    searchQuery: string
}

function TreeSelectNode({
    node,
    level,
    selectedIds,
    expandedIds,
    onToggleExpand,
    onToggleSelect,
    searchQuery,
}: TreeSelectNodeProps) {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selectedIds.has(node.id)

    // Filter logic - show if matches search or has matching children
    const matchesSearch = !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase())

    const hasMatchingChildren =
        searchQuery &&
        node.children?.some(
            child => child.label.toLowerCase().includes(searchQuery.toLowerCase()) || (child.children?.length ?? 0) > 0,
        )

    if (!matchesSearch && !hasMatchingChildren) {
        return null
    }

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group',
                    isSelected && 'bg-primary/10',
                )}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                {/* Expand/Collapse Button */}
                {hasChildren ? (
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            onToggleExpand(node.id)
                        }}
                        className="p-0.5 hover:bg-muted rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {/* Checkbox */}
                <Checkbox isSelected={isSelected} onChange={() => onToggleSelect(node.id)} className="size-4" />

                {/* Icon */}
                {hasChildren ? (
                    <FolderIcon className="size-4 text-amber-500" />
                ) : (
                    <FileIcon className="size-4 text-blue-500" />
                )}

                {/* Label */}
                <span className="text-sm flex-1">{node.label}</span>

                {/* Children count badge */}
                {hasChildren && (
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.children!.length}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map(child => (
                        <TreeSelectNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedIds={selectedIds}
                            expandedIds={expandedIds}
                            onToggleExpand={onToggleExpand}
                            onToggleSelect={onToggleSelect}
                            searchQuery={searchQuery}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function TreeSelect() {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['documents', 'projects']))
    const [searchQuery, setSearchQuery] = useState('')

    // Get all node IDs recursively
    const getAllNodeIds = (nodes: TreeNode[]): string[] => {
        return nodes.flatMap(node => [node.id, ...(node.children ? getAllNodeIds(node.children) : [])])
    }

    // Get labels for selected items
    const getSelectedLabels = (nodes: TreeNode[], ids: Set<string>): string[] => {
        return nodes.flatMap(node => {
            const labels: string[] = []
            if (ids.has(node.id)) {
                labels.push(node.label)
            }
            if (node.children) {
                labels.push(...getSelectedLabels(node.children, ids))
            }
            return labels
        })
    }

    const selectedLabels = useMemo(() => getSelectedLabels(sampleTreeData, selectedIds), [selectedIds])

    const handleToggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedIds(newExpanded)
    }

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleSelectAll = () => {
        const allIds = getAllNodeIds(sampleTreeData)
        setSelectedIds(new Set(allIds))
    }

    const handleClearAll = () => {
        setSelectedIds(new Set())
    }

    const handleExpandAll = () => {
        const allIds = getAllNodeIds(sampleTreeData)
        setExpandedIds(new Set(allIds))
    }

    const handleCollapseAll = () => {
        setExpandedIds(new Set())
    }

    return (
        <div className="w-[400px]">
            <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
                <Button variant="outline" className="w-full justify-between" onClick={() => setIsOpen(!isOpen)}>
                    <span className="truncate">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select folders and files...'}
                    </span>
                    <ChevronDown className="size-4 opacity-50" />
                </Button>

                <Popover className="w-[400px] p-0">
                    <div className="flex flex-col">
                        {/* Header with Search */}
                        <div className="p-3 border-b space-y-2">
                            <BsSearchField
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search..."
                                containerClassName="w-full"
                            />

                            {/* Action Buttons */}
                            <div className="flex gap-2 text-xs">
                                <Button size="sm" variant="ghost" onClick={handleSelectAll} className="h-7">
                                    Select All
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7">
                                    Clear All
                                </Button>
                                <div className="flex-1" />
                                <Button size="sm" variant="ghost" onClick={handleExpandAll} className="h-7">
                                    Expand All
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCollapseAll} className="h-7">
                                    Collapse All
                                </Button>
                            </div>
                        </div>

                        {/* Tree Content */}
                        <ScrollArea className="h-[300px]">
                            <div className="p-2">
                                {sampleTreeData.map(node => (
                                    <TreeSelectNode
                                        key={node.id}
                                        node={node}
                                        level={0}
                                        selectedIds={selectedIds}
                                        expandedIds={expandedIds}
                                        onToggleExpand={handleToggleExpand}
                                        onToggleSelect={handleToggleSelect}
                                        searchQuery={searchQuery}
                                    />
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Selected Items Display */}
                        {selectedIds.size > 0 && (
                            <div className="p-3 border-t bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Selected ({selectedIds.size})</span>
                                    <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-6">
                                        <XIcon className="size-3" />
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedLabels.slice(0, 10).map((label, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                    {selectedLabels.length > 10 && (
                                        <span className="inline-flex items-center px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                                            +{selectedLabels.length - 10} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="p-3 border-t flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    console.log('Selected IDs:', Array.from(selectedIds))
                                    setIsOpen(false)
                                }}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </Popover>
            </PopoverTrigger>
        </div>
    )
}
