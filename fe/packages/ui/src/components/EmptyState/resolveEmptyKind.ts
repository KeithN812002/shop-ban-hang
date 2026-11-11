import type { EmptyStateKind } from './EmptyState'

export interface ResolveEmptyKindOptions {
    isError?: boolean
    hasActiveFilter?: boolean
}

export const resolveEmptyKind = ({ isError, hasActiveFilter }: ResolveEmptyKindOptions = {}): EmptyStateKind => {
    if (isError) return 'error'
    if (hasActiveFilter) return 'no-match'
    return 'no-records'
}
