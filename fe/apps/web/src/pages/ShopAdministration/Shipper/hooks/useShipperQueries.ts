import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchShippers } from '../../services/shopAdminService'
import type { ShipperFilterRequest } from '../../types'

export const shipperKeys = {
    all: ['shop-admin', 'shipper'] as const,
    lists: () => [...shipperKeys.all, 'list'] as const,
    list: (filters: ShipperFilterRequest) => [...shipperKeys.lists(), filters] as const,
}

export const useShippers = (filters: ShipperFilterRequest) =>
    useQuery({
        queryKey: shipperKeys.list(filters),
        queryFn: () => searchShippers(filters),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
    })
