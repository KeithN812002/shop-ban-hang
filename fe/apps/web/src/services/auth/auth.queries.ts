import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import * as authService from './auth.service'
import type {
    ConfirmChangePasswordRequest,
    ExchangeAuthCodeRequest,
    PasswordPolicy,
    PermissionView,
    UserInfo,
    RequestOtpRequest,
} from './auth.types'

// Don't retry 4xx (client errors); retry once for transient errors (5xx / network).
const retryOnlyTransient = (failureCount: number, error: unknown) => {
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (status && status >= 400 && status < 500) return false
    return failureCount < 1
}

// Query Keys
const AUTH_KEY = ['auth'] as const

export const authKeys = {
    all: AUTH_KEY,
    userInfo: [...AUTH_KEY, 'userInfo'] as const,
    permissions: [...AUTH_KEY, 'permissions'] as const,
    passwordPolicy: [...AUTH_KEY, 'passwordPolicy'] as const,
}

/**
 * Hook to exchange auth code for token
 */
export const useExchangeAuthCode = () => {
    return useMutation({
        mutationFn: (request: ExchangeAuthCodeRequest) => authService.exchangeAuthCode(request),
    })
}

/**
 * Hook to fetch user info
 * Token is automatically added by axios interceptor
 */
export const useFetchUserInfo = (enabled = true) => {
    return useQuery<UserInfo>({
        queryKey: authKeys.userInfo,
        queryFn: () => authService.fetchUserInfo(),
        enabled: enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: retryOnlyTransient,
        // The no-access screen already informs the user; skip the global error toast.
        meta: { skipGlobalError: true },
    })
}

/**
 * Hook to fetch permissions for FE
 */
export const useFetchPermissions = (enabled = true) => {
    return useQuery<PermissionView[]>({
        queryKey: authKeys.permissions,
        queryFn: () => authService.fetchPermissions(),
        enabled: enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: retryOnlyTransient,
    })
}

/**
 * Hook to logout
 * Token is automatically added by axios interceptor
 */
export const useLogout = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (refreshToken?: string) => authService.logout(refreshToken),
        onSuccess: () => {
            // Clear all auth queries immediately
            queryClient.removeQueries({ queryKey: authKeys.all })
            queryClient.cancelQueries({ queryKey: authKeys.all })
        },
        onError: () => {
            // Even on error, clear queries to prevent stale data
            queryClient.removeQueries({ queryKey: authKeys.all })
            queryClient.cancelQueries({ queryKey: authKeys.all })
        },
    })
}

/**
 * Hook to fetch the realm password policy (rendered as live rules in the change-password dialog).
 * Fetched only when the dialog is open; never blocks the UI on failure.
 */
export const usePasswordPolicy = (enabled = true) => {
    return useQuery<PasswordPolicy>({
        queryKey: authKeys.passwordPolicy,
        queryFn: () => authService.fetchPasswordPolicy(),
        enabled,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: false,
        retry: retryOnlyTransient,
        meta: { skipGlobalError: true },
    })
}

export const useConfirmChangePassword = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request: ConfirmChangePasswordRequest) => authService.confirmChangePassword(request),
        onSuccess: () => {
            // Password change doesn't affect permissions, but refresh auth queries to stay consistent.
            queryClient.invalidateQueries({ queryKey: authKeys.userInfo })
        },
    })
}

export const useRequestChangePasswordOtp = () => {
    return useMutation({
        mutationFn: (req: RequestOtpRequest) => authService.requestChangePasswordOtp(req),
    })
}

export const useResendChangePasswordOtp = () => {
    return useMutation({
        mutationFn: () => authService.resendChangePasswordOtp(),
    })
}
