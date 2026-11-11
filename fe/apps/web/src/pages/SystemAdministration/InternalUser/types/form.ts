import type { BaseStatus } from '@/types/api.types'

export interface InternalUserFormData {
    id?: string
    userName: string
    personalName: string
    email?: string | null
    roles: string[]
    status: BaseStatus
}
