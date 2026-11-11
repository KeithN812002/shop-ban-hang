import { memo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { PermissionTreeNode as PermissionTreeNodeType } from '../types'
import { isSidebarMenuType, getIcon } from '../utils/constants'
import { StatusEnum } from '@/constants/options/status-options'
import { Tooltip, TooltipTrigger } from '@workspace/ui/components/Tooltip'
import { Focusable } from 'react-aria'

interface PermissionTreeNodeProps {
    node: PermissionTreeNodeType
    level: number
    expandedNodes: Set<string>
    selectedCode: string | null
    onToggle: (code: string) => void
    onSelect: (node: PermissionTreeNodeType) => void
    isLast?: boolean
}

export const PermissionTreeNode = memo(
    ({ node, level, expandedNodes, selectedCode, onToggle, onSelect, isLast = false }: PermissionTreeNodeProps) => {
        const isExpanded = expandedNodes.has(node.code)
        const visibleChildren = node.children?.filter(c => isSidebarMenuType(c.type)) || []
        const hasVisibleChildren = visibleChildren.length > 0
        const isSelected = selectedCode === node.code
        const isInactive = node.status !== StatusEnum.ACTIVE

        return (
            <div className="relative flex flex-col">
                {level > 0 && (
                    <span
                        aria-hidden
                        className={`pointer-events-none absolute -left-[14px] top-0 w-px bg-border ${isLast ? 'h-4' : '-bottom-1'}`}
                    />
                )}
                <TooltipTrigger delay={300}>
                    <Focusable>
                        <div
                            className={`relative flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors ${
                                isSelected ? 'selection-indicator bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted'
                            }`}
                            onClick={() => onSelect(node)}
                        >
                            {level > 0 && (
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -left-[13px] top-1/2 flex -translate-y-1/2 items-center text-border"
                                >
                                    <span className="h-px w-1.5 bg-current" />
                                    <span className="border-y-[3px] border-l-4 border-y-transparent border-l-current" />
                                </span>
                            )}
                            <span className={`flex shrink-0 ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                                {getIcon(node.type)}
                            </span>
                            <span
                                className={`text-sm truncate flex-1 focus:outline-none outline-none ${isSelected ? 'text-primary font-medium' : 'text-foreground/90'} ${isInactive ? 'opacity-50' : ''}`}
                            >
                                {node.name}
                            </span>
                            {hasVisibleChildren ? (
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.stopPropagation()
                                        onToggle(node.code)
                                    }}
                                    className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="size-4" />
                                    ) : (
                                        <ChevronRight className="size-4" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-5 shrink-0" />
                            )}
                        </div>
                    </Focusable>
                    <Tooltip placement="right">{node.name}</Tooltip>
                </TooltipTrigger>

                {hasVisibleChildren && isExpanded && (
                    <div className="ml-[15px] pl-[14px] flex flex-col gap-1 my-0.5">
                        {visibleChildren.map((child, index) => (
                            <PermissionTreeNode
                                key={child.code}
                                node={child}
                                level={level + 1}
                                expandedNodes={expandedNodes}
                                selectedCode={selectedCode}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                isLast={index === visibleChildren.length - 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    },
)

PermissionTreeNode.displayName = 'PermissionTreeNode'
