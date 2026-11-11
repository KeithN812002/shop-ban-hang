import { useTranslation } from 'react-i18next'
import { memo } from 'react'
import { ActionButton } from '@/components/Common/ActionButton'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import { Panel, PanelHeader, PanelContent, PanelFooter } from '@workspace/ui/components/Panel'
import { EmptyState, resolveEmptyKind } from '@workspace/ui/components/EmptyState'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import type { PermissionTreeNode as PermissionTreeNodeType } from '../types'
import { PermissionTreeNode } from './PermissionTreeNode'

interface PermissionTreeProps {
    searchKeyword: string
    onSearchChange: (value: string) => void
    filteredTree: PermissionTreeNodeType[]
    expandedNodes: Set<string>
    selectedCode: string | null
    onToggle: (code: string) => void
    onSelect: (node: PermissionTreeNodeType) => void
    onAddNew: () => void
    isAddNewDisabled: boolean
}

export const PermissionTree = memo(
    ({
        searchKeyword,
        onSearchChange,
        filteredTree,
        expandedNodes,
        selectedCode,
        onToggle,
        onSelect,
        onAddNew,
        isAddNewDisabled,
    }: PermissionTreeProps) => {
        const { t } = useTranslation()
        const { checkPermission } = usePermissionAction()
        const canCreate = checkPermission('create')

        return (
            <Panel className="w-[300px] shrink-0">
                <PanelHeader className="scrollbar-float scrollbar-divided -mx-1 min-h-14 overflow-y-hidden py-3 pl-4 pr-[5px]">
                    <BsSearchField value={searchKeyword} onChange={onSearchChange} />
                </PanelHeader>
                <PanelContent className="scrollbar-float scrollbar-divided -mx-1 py-3 pl-4 pr-[5px]">
                    {filteredTree.length === 0 ? (
                        <EmptyState
                            kind={resolveEmptyKind({ hasActiveFilter: !!searchKeyword })}
                            variant="compact"
                            className="h-40"
                        />
                    ) : (
                        filteredTree.map(node => (
                            <PermissionTreeNode
                                key={node.code}
                                node={node}
                                level={0}
                                expandedNodes={expandedNodes}
                                selectedCode={selectedCode}
                                onToggle={onToggle}
                                onSelect={onSelect}
                            />
                        ))
                    )}
                </PanelContent>
                {canCreate && (
                    <PanelFooter className="scrollbar-float scrollbar-divided -mx-1 overflow-y-hidden pl-4 pr-[5px]">
                        <ActionButton
                            className="w-full"
                            isDisabled={isAddNewDisabled}
                            onPress={onAddNew}
                            actionCode="create"
                            actionType="addNew"
                        />
                    </PanelFooter>
                )}
            </Panel>
        )
    },
)

PermissionTree.displayName = 'PermissionTree'
