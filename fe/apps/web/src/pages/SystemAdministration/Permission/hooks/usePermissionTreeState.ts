import { useMemo, useState } from 'react'
import { type PermissionTreeNode } from '../types'
import { PermissionTypeEnum } from '@/constants/options'
import { isSidebarMenuType } from '../utils/constants'

export const usePermissionTreeState = (tree: PermissionTreeNode[]) => {
    const [searchKeyword, setSearchKeyword] = useState('')
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

    const toggleExpand = (code: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev)
            if (next.has(code)) {
                next.delete(code)
            } else {
                next.add(code)
            }
            return next
        })
    }

    const { filteredTree, availableParents } = useMemo(() => {
        const collectParents = (nodes: PermissionTreeNode[]): PermissionTreeNode[] => {
            const result: PermissionTreeNode[] = []
            for (const node of nodes) {
                if (
                    node.type === PermissionTypeEnum.MODULE ||
                    node.type === PermissionTypeEnum.GROUP ||
                    node.type === PermissionTypeEnum.MENU ||
                    node.type === PermissionTypeEnum.PAGE
                ) {
                    result.push({ ...node, children: undefined })
                }
                if (node.children) {
                    result.push(...collectParents(node.children))
                }
            }
            return result
        }

        const availableParents = collectParents(tree)
        const searchLower = searchKeyword.toLowerCase()

        if (searchLower) {
            const filterRecursive = (nodes: PermissionTreeNode[]): PermissionTreeNode[] =>
                nodes
                    .filter(node => isSidebarMenuType(node.type))
                    .map(node => {
                        const matches =
                            node.name.toLowerCase().includes(searchLower) ||
                            node.code.toLowerCase().includes(searchLower)
                        const filteredChildren = filterRecursive(node.children || [])
                        if (matches || filteredChildren.length > 0) {
                            return { ...node, children: filteredChildren }
                        }
                        return null
                    })
                    .filter(Boolean) as PermissionTreeNode[]

            return { filteredTree: filterRecursive(tree), availableParents }
        }

        return {
            filteredTree: tree.filter(node => isSidebarMenuType(node.type)),
            availableParents,
        }
    }, [tree, searchKeyword])

    return {
        searchKeyword,
        setSearchKeyword,
        expandedNodes,
        setExpandedNodes,
        toggleExpand,
        filteredTree,
        availableParents,
    }
}
