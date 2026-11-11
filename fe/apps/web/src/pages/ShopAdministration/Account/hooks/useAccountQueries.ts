import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchAccounts } from '../../services/shopAdminService'
import type { AccountFilterRequest, AccountRow } from '../../types'

export const accountKeys = {
    all: ['shop-admin', 'account'] as const,
    lists: () => [...accountKeys.all, 'list'] as const,
    list: (filters: AccountFilterRequest) => [...accountKeys.lists(), filters] as const,
}

export const useAccounts = (filters: AccountFilterRequest) =>
    useQuery({
        queryKey: accountKeys.list(filters),
        queryFn: async () => {
            const page = await searchAccounts(filters)
            return { ...page, items: page.items.map((item): AccountRow => ({ ...item, id: item.userId })) }
        },
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })
