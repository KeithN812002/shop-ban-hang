import { PermissionTypeEnum } from '@/constants/options'

export interface ParentOption {
    id: string
    name: string
}

interface ParentTreeNode {
    code: string
    name: string
    type: PermissionTypeEnum | string
    children?: ParentTreeNode[]
}

export const buildParentOptionsByTypes = (
    nodes: ParentTreeNode[],
    allowedTypes: Array<ParentTreeNode['type']>,
): ParentOption[] => {
    const result: ParentOption[] = []

    const flatten = (items: ParentTreeNode[]) => {
        for (const node of items) {
            if (allowedTypes.includes(node.type)) {
                const prefix =
                    node.type === PermissionTypeEnum.MODULE
                        ? 'Module'
                        : node.type === PermissionTypeEnum.GROUP
                          ? 'Group'
                          : node.type === PermissionTypeEnum.MENU
                            ? 'Menu'
                            : node.type === PermissionTypeEnum.PAGE
                              ? 'Page'
                              : 'Menu'
                result.push({ id: node.code, name: `${prefix}: ${node.name}` })
            }
            if (node.children?.length) {
                flatten(node.children)
            }
        }
    }

    flatten(nodes)
    return result
}
