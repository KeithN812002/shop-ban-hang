import { PermissionTypeEnum } from '@/constants/options'

export interface PermissionImportItemSummary {
    code: string
    type: PermissionTypeEnum
    moduleCode?: string | null
    name: string
    parentCode?: string | null
    uri?: string | null
    buttonAction?: string | null
}

export interface PermissionImportRoleSummary {
    code: string
    name?: string | null
}

export interface PermissionImportDeleteSummary extends PermissionImportItemSummary {
    roles: PermissionImportRoleSummary[]
}

export interface PermissionFieldChange {
    field: string
    oldValue?: string | null
    newValue?: string | null
}

export interface PermissionImportUpdateSummary {
    code: string
    type: PermissionTypeEnum
    moduleCode?: string | null
    name: string
    changes: PermissionFieldChange[]
}

export interface PermissionImportRenameHint {
    currentCode: string
    incomingCode: string
    uri?: string | null
    buttonAction?: string | null
    name?: string | null
}

export interface PermissionImportApplyScope {
    applyAdd: boolean
    applyUpdate: boolean
    applyDelete: boolean
}

export interface PermissionImportPreviewResponse {
    fileCount: number
    currentCount: number
    blockers: string[]
    toAdd: PermissionImportItemSummary[]
    toUpdate: PermissionImportUpdateSummary[]
    toDelete: PermissionImportDeleteSummary[]
    renameHints: PermissionImportRenameHint[]
    uriWarnings: string[]
    roleAssignmentsToDelete: number
}
