import { useProfileQuery } from '@/features/account/queries'
import { useAuth } from '@/providers/auth-provider'
import type { Profile, RegistrationStatus } from '@/types/shop'

export interface UseProfileResult {
    isAuthenticated: boolean
    isLoading: boolean
    isError: boolean
    profile: Profile | undefined
    /** Owns a store with status ACTIVE (can use /seller/*) */
    isSeller: boolean
    /** Has an ACTIVE shipper row (can use /shipper/*) */
    isShipper: boolean
    /** Raw store registration status; null = never registered */
    storeStatus: RegistrationStatus | null
    /** Raw shipper registration status; null = never registered */
    shipperStatus: RegistrationStatus | null
    cartCount: number
    unreadNotifications: number
    refetch: () => void
}

/**
 * Single source of truth for "who is this user" on the storefront.
 * Seller Center / Shipper pages use `isSeller` / `isShipper` for access and `storeStatus` /
 * `shipperStatus` to explain why access is missing (PENDING / REJECTED / SUSPENDED).
 */
export function useProfile(): UseProfileResult {
    const { isAuthenticated } = useAuth()
    const query = useProfileQuery()
    const profile = isAuthenticated ? query.data : undefined

    // `isSeller` alone (older payloads without a status) is treated as ACTIVE.
    const storeStatus: RegistrationStatus | null = profile?.storeStatus ?? (profile?.isSeller ? 'ACTIVE' : null)
    const shipperStatus: RegistrationStatus | null =
        profile?.shipperStatus ?? (profile?.isShipper ? 'ACTIVE' : null)

    return {
        isAuthenticated,
        isLoading: isAuthenticated && query.isLoading,
        isError: isAuthenticated && query.isError,
        profile,
        isSeller: storeStatus === 'ACTIVE',
        isShipper: shipperStatus === 'ACTIVE',
        storeStatus,
        shipperStatus,
        cartCount: profile?.cartCount ?? 0,
        unreadNotifications: profile?.unreadNotifications ?? 0,
        refetch: () => {
            void query.refetch()
        },
    }
}
