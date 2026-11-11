import { PermissionTypeEnum } from '@/constants/options'

export interface ExchangeAuthCodeRequest {
    code: string
    redirect_uri: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
    idToken?: string
}

export interface ExchangeAuthCodeResponse extends AuthTokens {
    expiresIn?: number
}

export interface UserInfo {
    sub: string
    email: string
    emailVerified: boolean
    name: string
    preferredUsername: string
    isInternal?: boolean
    modules: string[]
    permissions: PermissionView[]
}

export interface PermissionView {
    moduleCode: string
    code: string
    name: string
    foreignName?: string | null
    type: PermissionTypeEnum
    parentCode: string | null
    url: string | null
    pathFolder?: string | null
    icon: string | null
    buttonAction?: string | null
    sortOrder: number | null
}

export interface RequestOtpRequest {
    oldPassword: string
    newPassword: string
}

export interface RequestOtpResponse {
    cooldownMinutes: number
    expireMinutes: number
}

export interface ConfirmChangePasswordRequest {
    otp: string
}

export interface PasswordPolicy {
    minLength?: number | null
    minDigits?: number | null
    minLowerCase?: number | null
    minUpperCase?: number | null
    minSpecialChars?: number | null
    regexPattern?: string | null
    rawPolicy?: string
}

export interface ModuleItem {
    id: string
    title: string
    description: string
    route: string
}
