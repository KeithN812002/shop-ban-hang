import type { BaseStatus } from '@/types/api.types'

export interface RoleFormData {
    id?: string
    code: string
    name: string
    status: BaseStatus
    permissionIds: string[]
}
