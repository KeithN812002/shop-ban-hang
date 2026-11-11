import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/providers/auth-provider'
import type { Uuid } from '@/types/api'
import type { AddressRequest } from '@/types/shop'
import {
    createAddress,
    deleteAddress,
    getAddresses,
    getProfile,
    getWishlist,
    markNotificationsRead,
    registerShipper,
    registerStore,
    searchNotifications,
    toggleFollowStore,
    toggleWishlist,
    updateAddress,
} from './api'

/** Everything scoped to the logged-in user lives under the ['me'] root so logout can drop it at once. */
export const meKeys = {
    all: ['me'] as const,
    profile: () => [...meKeys.all, 'profile'] as const,
    addresses: () => [...meKeys.all, 'addresses'] as const,
    wishlist: () => [...meKeys.all, 'wishlist'] as const,
    notifications: () => [...meKeys.all, 'notifications'] as const,
    notificationPreview: () => [...meKeys.all, 'notifications', 'preview'] as const,
}

export const useProfileQuery = () => {
    const { isAuthenticated } = useAuth()
    return useQuery({
        queryKey: meKeys.profile(),
        queryFn: getProfile,
        enabled: isAuthenticated,
        staleTime: 30_000,
        refetchInterval: isAuthenticated ? 60_000 : false,
    })
}

export const useAddresses = () => {
    const { isAuthenticated } = useAuth()
    return useQuery({ queryKey: meKeys.addresses(), queryFn: getAddresses, enabled: isAuthenticated })
}

export const useSaveAddress = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (req: AddressRequest) => (req.id ? updateAddress(req) : createAddress(req)),
        onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.addresses() }),
    })
}

export const useDeleteAddress = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: Uuid) => deleteAddress(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.addresses() }),
    })
}

export const useWishlist = () => {
    const { isAuthenticated } = useAuth()
    return useQuery({ queryKey: meKeys.wishlist(), queryFn: getWishlist, enabled: isAuthenticated })
}

export const useToggleWishlist = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (productId: Uuid) => toggleWishlist(productId),
        onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.wishlist() }),
    })
}

export const useToggleFollow = () => useMutation({ mutationFn: (storeId: Uuid) => toggleFollowStore(storeId) })

export const useNotifications = (pageSize = 20) =>
    useInfiniteQuery({
        queryKey: [...meKeys.notifications(), pageSize],
        queryFn: ({ pageParam }) => searchNotifications({ pageNumber: pageParam, pageSize }),
        initialPageParam: 1,
        getNextPageParam: last => (last.pageNumber < last.totalPages ? last.pageNumber + 1 : undefined),
    })

export const useNotificationPreview = (enabled: boolean) =>
    useQuery({
        queryKey: meKeys.notificationPreview(),
        queryFn: () => searchNotifications({ pageNumber: 1, pageSize: 6 }),
        enabled,
        placeholderData: keepPreviousData,
    })

export const useMarkNotificationsRead = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (req: { ids?: Uuid[]; all?: boolean }) => markNotificationsRead(req),
        meta: { silent: true },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: meKeys.notifications() })
            qc.invalidateQueries({ queryKey: meKeys.profile() })
        },
    })
}

export const useRegisterStore = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: registerStore,
        onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.profile() }),
    })
}

export const useRegisterShipper = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: registerShipper,
        onSuccess: () => qc.invalidateQueries({ queryKey: meKeys.profile() }),
    })
}
