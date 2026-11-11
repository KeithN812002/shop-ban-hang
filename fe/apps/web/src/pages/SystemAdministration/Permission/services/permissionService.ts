import type { AxiosResponse } from 'axios'
import { downloadFile } from '@workspace/ui/lib/file'
import { request } from '@/lib/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
    PermissionCreateRequest,
    PermissionDetailResponse,
    PermissionImportApplyScope,
    PermissionImportPreviewResponse,
    PermissionResponse,
    PermissionUpdateRequest,
} from '../types'
import {
    mapDetailToResponse,
    mapSummaryToResponse,
    type PermissionDetailDto,
    type PermissionSummaryDto,
} from './mapper'

export const fetchAllPermissions = async (): Promise<PermissionResponse[]> => {
    const response: ApiResponse<PermissionSummaryDto[]> = await request.get('sa/permission/all')
    const data = response.data || []
    return data.map(mapSummaryToResponse)
}

export const fetchPermissionDetail = async (id: string): Promise<PermissionDetailResponse | undefined> => {
    const response: ApiResponse<PermissionDetailDto> = await request.get(`sa/permission/${id}`)
    return response.data ? mapDetailToResponse(response.data) : undefined
}

export const fetchActivePermissionsForRole = async (): Promise<PermissionResponse[]> => {
    const response: ApiResponse<PermissionSummaryDto[]> = await request.get('sa/permission/all-active-for-role')
    const data = response.data || []
    return data.map(mapSummaryToResponse)
}

export const createPermission = async (data: PermissionCreateRequest): Promise<void> => {
    await request.post('sa/permission/create', data)
}

export const updatePermission = async (data: PermissionUpdateRequest): Promise<void> => {
    await request.post('sa/permission/update', data)
}

export const deletePermission = async (id: string): Promise<void> => {
    await request.post('sa/permission/delete', { id })
}

export const downloadPermissionExport = async (): Promise<void> => {
    const response: AxiosResponse<Blob> = await request.get('sa/permission/export', {
        responseType: 'blob',
    })
    const url = window.URL.createObjectURL(response.data)
    downloadFile(url, 'sa_permission.json')
    window.URL.revokeObjectURL(url)
}

export const previewPermissionImport = async (file: File): Promise<PermissionImportPreviewResponse | undefined> => {
    const formData = new FormData()
    formData.append('file', file)
    const response: ApiResponse<PermissionImportPreviewResponse> = await request.post(
        'sa/permission/import/preview',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    )
    return response.data
}

export const applyPermissionImport = async (
    file: File,
    confirmDeleteCount: number,
    scope: PermissionImportApplyScope,
): Promise<PermissionImportPreviewResponse | undefined> => {
    const formData = new FormData()
    formData.append('file', file)
    const response: ApiResponse<PermissionImportPreviewResponse> = await request.post(
        'sa/permission/import/apply',
        formData,
        {
            params: { confirmDeleteCount, ...scope },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    )
    return response.data
}
