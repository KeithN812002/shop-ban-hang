import type { CategoryNode, CategoryRow } from '../types'

/** Depth-first flatten of the category tree, keeping siblings ordered by `sortOrder`. `parentId` is derived from the tree position. */
export const flattenCategories = (
    nodes: CategoryNode[],
    depth = 0,
    parentPath = '',
    parentId: string | null = null,
): CategoryRow[] =>
    [...nodes]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .flatMap(node => {
            const path = parentPath ? `${parentPath} / ${node.name}` : node.name
            const row: CategoryRow = {
                id: node.id,
                name: node.name,
                slug: node.slug,
                icon: node.icon,
                imageUrl: node.imageUrl,
                parentId,
                sortOrder: node.sortOrder ?? 0,
                status: node.status ?? 'ACTIVE',
                depth,
                path,
            }
            return [row, ...flattenCategories(node.children ?? [], depth + 1, path, node.id)]
        })

/** Ids of a category and all its descendants (a category cannot be moved under itself). */
export const collectDescendantIds = (rows: CategoryRow[], id: string): Set<string> => {
    const ids = new Set<string>([id])
    let changed = true
    while (changed) {
        changed = false
        for (const row of rows) {
            if (row.parentId && ids.has(row.parentId) && !ids.has(row.id)) {
                ids.add(row.id)
                changed = true
            }
        }
    }
    return ids
}
