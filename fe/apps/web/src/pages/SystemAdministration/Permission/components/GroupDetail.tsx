'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput, BsTextArea } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import type { PermissionFormData, PermissionTreeNode } from '../types'
import { STATUS_OPTIONS, StatusEnum, PermissionTypeEnum } from '@/constants/options'
import { BsIconPicker, buildParentOptionsByTypes } from '@/shared/permission'
import { urlSegmentRules } from '../utils'

interface GroupDetailProps {
    availableParents: PermissionTreeNode[]
    isReadOnly?: boolean
}

export function GroupDetail({ availableParents, isReadOnly }: GroupDetailProps) {
    const { t } = useTranslation()
    const { setValue, watch } = useFormContext<PermissionFormData>()

    const groupTypeSelectOptions = useMemo(
        () => [{ id: PermissionTypeEnum.GROUP, name: t('permission.typeLabels.group') }],
        [t],
    )
    const parentOptions = useMemo(
        () => buildParentOptionsByTypes(availableParents, [PermissionTypeEnum.MODULE, PermissionTypeEnum.GROUP]),
        [availableParents],
    )

    const [icon, parentCode, status, urlSegment] = watch(['icon', 'parentCode', 'status', 'urlSegment'])

    const parentUrlBase = useMemo(
        () => availableParents.find(p => p.code === parentCode)?.url ?? '',
        [availableParents, parentCode],
    )

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <BsSelect
                    label={t('permission.fields.type')}
                    isRequired
                    isDisabled
                    options={groupTypeSelectOptions}
                    selectedValue={PermissionTypeEnum.GROUP}
                />
                <BsSelect
                    label={t('permission.fields.parentCode')}
                    isRequired
                    options={parentOptions}
                    selectedValue={parentCode || null}
                    isDisabled={isReadOnly}
                    onChange={value =>
                        setValue('parentCode', value ? String(value) : '', { shouldDirty: true, shouldValidate: true })
                    }
                />
                <BsInput label={t('permission.fields.code')} isRequired isDisabled name="code" />
                <BsIconPicker
                    label={t('permission.fields.icon')}
                    value={icon || null}
                    isDisabled={isReadOnly}
                    onChange={value => setValue('icon', value, { shouldDirty: true, shouldValidate: true })}
                />
                <BsInput
                    label={t('permission.fields.name')}
                    isRequired
                    maxLength={200}
                    name="name"
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.foreignName')}
                    isRequired
                    maxLength={200}
                    name="foreignName"
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.sortOrder')}
                    name="sortOrder"
                    format="integer"
                    min={0}
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.urlSegment')}
                    name="urlSegment"
                    maxLength={200}
                    rules={urlSegmentRules(t('permission.messages.urlSegmentLeadingSlash'))}
                    isDisabled={isReadOnly}
                    description={
                        parentUrlBase || urlSegment
                            ? `${t('permission.fields.fullUrl')}: ${parentUrlBase}${urlSegment ?? ''}`
                            : undefined
                    }
                />
                <BsSelect
                    label={t('permission.fields.status')}
                    isRequired
                    options={STATUS_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    selectedValue={status}
                    isDisabled={isReadOnly}
                    onChange={value =>
                        setValue('status', value as StatusEnum, { shouldDirty: true, shouldValidate: true })
                    }
                />
            </div>

            <BsTextArea
                label={t('permission.fields.description')}
                maxLength={500}
                name="description"
                isDisabled={isReadOnly}
            />
        </div>
    )
}
