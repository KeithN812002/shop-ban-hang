import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { BsInput, BsTextArea } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import type { PermissionFormData } from '../types'
import { STATUS_OPTIONS, StatusEnum, PermissionTypeEnum } from '@/constants/options'
import { BsIconPicker } from '@/shared/permission'

interface ModuleDetailProps {
    isReadOnly?: boolean
}

export function ModuleDetail({ isReadOnly }: ModuleDetailProps) {
    const { t } = useTranslation()
    const { setValue, watch } = useFormContext<PermissionFormData>()
    const moduleTypeSelectOptions = useMemo(
        () => [{ id: PermissionTypeEnum.MODULE, name: t('permission.typeLabels.module') }],
        [t],
    )

    const [icon, status] = watch(['icon', 'status'])

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <BsSelect
                    label={t('permission.fields.type')}
                    isRequired
                    isDisabled
                    options={moduleTypeSelectOptions}
                    selectedValue={PermissionTypeEnum.MODULE}
                />
                <BsInput
                    label={t('permission.fields.code')}
                    name="code"
                    isRequired
                    isDisabled
                    containerClassName="col-start-1"
                />
                <BsIconPicker
                    label={t('permission.fields.icon')}
                    value={icon || null}
                    isDisabled={isReadOnly}
                    onChange={value => setValue('icon', value, { shouldDirty: true, shouldValidate: true })}
                />
                <BsInput
                    label={t('permission.fields.name')}
                    name="name"
                    isRequired
                    maxLength={200}
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.foreignName')}
                    name="foreignName"
                    isRequired
                    maxLength={200}
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.sortOrder')}
                    name="sortOrder"
                    format="integer"
                    min={0}
                    isDisabled={isReadOnly}
                />
                <BsInput name="urlSegment" label={t('permission.fields.urlSegment')} maxLength={200} isDisabled />
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
                name="description"
                maxLength={500}
                isDisabled={isReadOnly}
            />
        </div>
    )
}
