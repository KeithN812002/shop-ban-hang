import { useQuery } from '@tanstack/react-query'
import * as lookupService from './lookup.service'

export const lookupKeys = {
    all: ['lookup'] as const,
    roleOptions: () => [...lookupKeys.all, 'role-options'] as const,
}

export const useRoleOptions = (enabled: boolean = true) => {
    return useQuery({
        queryKey: lookupKeys.roleOptions(),
        queryFn: () => lookupService.getRoleOptions(),
        staleTime: 0,
        enabled,
    })
}
