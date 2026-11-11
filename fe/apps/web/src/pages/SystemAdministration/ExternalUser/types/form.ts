import type { BaseStatus } from '@/types/api.types'

export interface ExternalUserFormData {
    id?: string
    userName: string
    personalName: string
    email?: string | null
    roles: string[]
    status: BaseStatus
    externalUnitCode?: string | null
}
