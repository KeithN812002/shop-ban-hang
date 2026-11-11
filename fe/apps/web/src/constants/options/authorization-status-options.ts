export enum AuthorizationStatusEnum {
    UNASSIGNED = 'UNASSIGNED',
    ASSIGNED = 'ASSIGNED',
}

export const AUTHORIZATION_STATUS_OPTIONS = [
    { value: AuthorizationStatusEnum.UNASSIGNED, label: 'user.fields.unassignedRole' },
    { value: AuthorizationStatusEnum.ASSIGNED, label: 'user.fields.assignedRole' },
] as const
