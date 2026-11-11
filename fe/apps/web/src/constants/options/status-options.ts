export enum StatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export const STATUS_OPTIONS = [
    { value: StatusEnum.ACTIVE, label: 'common.active' },
    { value: StatusEnum.INACTIVE, label: 'common.inactive' },
] as const
