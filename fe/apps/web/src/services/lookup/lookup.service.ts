import { request } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'
import type { OptionResponse } from './lookup.types'

export const getRoleOptions = async (): Promise<OptionResponse[]> => {
    const response: ApiResponse<OptionResponse[]> = await request.get('/sa/role/options')
    return response.data
}
