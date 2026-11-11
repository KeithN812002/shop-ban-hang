import type {
    ConfirmChangePasswordRequest,
    ExchangeAuthCodeRequest,
    ExchangeAuthCodeResponse,
    PasswordPolicy,
    PermissionView,
    UserInfo,
    RequestOtpRequest,
    RequestOtpResponse,
} from './auth.types'
import { request } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'

export const exchangeAuthCode = async (req: ExchangeAuthCodeRequest): Promise<ExchangeAuthCodeResponse> => {
    const params = new URLSearchParams()
    params.append('authCode', req.code)
    params.append('redirectUri', req.redirect_uri)

    const response: ApiResponse<ExchangeAuthCodeResponse> = await request.post(
        'sa/auth/exchange-auth-code',
        params.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        },
    )

    return {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        idToken: response.data.idToken,
        expiresIn: response.data.expiresIn,
    }
}

export const fetchUserInfo = async (): Promise<UserInfo> => {
    const response: ApiResponse<UserInfo> = await request.get('sa/auth/me')
    return response.data
}

export const fetchPermissions = async (): Promise<PermissionView[]> => {
    const response: ApiResponse<{ permissions: PermissionView[] }> = await request.get('sa/auth/permissions')
    return response.data.permissions
}

export const logout = async (refreshToken?: string): Promise<void> => {
    try {
        await request.post(
            'sa/auth/logout',
            { refreshToken: refreshToken || '' },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
    } catch (error) {
        console.warn('Backend logout failed (non-critical):', error)
    }
}

export const confirmChangePassword = async (req: ConfirmChangePasswordRequest): Promise<void> => {
    await request.post('sa/auth/confirm-change-password', req)
}

export const fetchPasswordPolicy = async (): Promise<PasswordPolicy> => {
    const response: ApiResponse<PasswordPolicy> = await request.get('sa/auth/password-policy')
    return response.data
}

export const requestChangePasswordOtp = async (req: RequestOtpRequest): Promise<RequestOtpResponse> => {
    const response: ApiResponse<RequestOtpResponse> = await request.post('sa/auth/request-otp', req)
    return response.data
}

export const resendChangePasswordOtp = async (): Promise<RequestOtpResponse> => {
    const response: ApiResponse<RequestOtpResponse> = await request.post('sa/auth/resend-otp')
    return response.data
}
