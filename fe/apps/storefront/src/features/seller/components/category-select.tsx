import { useMemo } from 'react'
import { Select } from '@/components/ui/form-controls'
import { useCategoryTree } from '@/features/catalog/queries'
import type { Uuid } from '@/types/api'
import type { CategoryNode } from '@/types/shop'

interface LeafOption {
    id: Uuid
    label: string
}

/** Leaves of the category tree with their breadcrumb ("Thời trang › Áo"), the only selectable nodes. */
export const flattenLeaves = (nodes: CategoryNode[], trail: string[] = []): LeafOption[] =>
    nodes.flatMap(node => {
        const path = [...trail, node.name]
        return node.children && node.children.length > 0
            ? flattenLeaves(node.children, path)
            : [{ id: node.id, label: path.join(' › ') }]
    })

interface CategorySelectProps {
    value: Uuid | ''
    onChange: (id: Uuid | '') => void
    /** Label of the "no selection" option; omit to force a choice. */
    emptyLabel?: string
    invalid?: boolean
    className?: string
    id?: string
}

/** Tree-aware category picker backed by GET /shop/public/category/tree. */
export function CategorySelect({ value, onChange, emptyLabel, invalid, className, id }: CategorySelectProps) {
    const tree = useCategoryTree()
    const options = useMemo(() => flattenLeaves(tree.data ?? []), [tree.data])
    return (
        <Select
            id={id}
            className={className}
            invalid={invalid}
            value={value}
            disabled={tree.isLoading}
            onChange={event => onChange(event.target.value)}
        >
            {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
            {options.map(option => (
                <option key={option.id} value={option.id}>
                    {option.label}
                </option>
            ))}
        </Select>
    )
}
