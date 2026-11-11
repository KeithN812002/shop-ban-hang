'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BsInput, BsTextArea } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Button } from '@workspace/ui/components/Button'
import { Settings, Lock, Plus, Trash2, Zap } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/Table'
import { TableInput, TableNumberInput, TableSelect } from '@workspace/ui/components/TableEdit'
import { EmptyState } from '@workspace/ui/components/EmptyState'
import type { PermissionDetailResponse, PermissionFormData, PermissionTreeNode } from '../types'
import { HTTP_METHOD_OPTIONS, STATUS_OPTIONS, StatusEnum, PermissionTypeEnum } from '@/constants/options'
import { buildParentOptionsByTypes } from '@/shared/permission'
import { urlSegmentRules } from '../utils'

interface PageDetailProps {
    data?: PermissionDetailResponse
    availableParents: PermissionTreeNode[]
    isReadOnly?: boolean
}

type FnRow = PermissionFormData['functions'][number]
type ApiRow = PermissionFormData['apis'][number]

export function PageDetail({ data, availableParents, isReadOnly }: PageDetailProps) {
    const { t } = useTranslation()
    const { setValue, watch, getValues } = useFormContext<PermissionFormData>()

    const pageTypeSelectOptions = useMemo<Array<{ id: string | number; name: string }>>(
        () => [{ id: PermissionTypeEnum.PAGE, name: t('permission.typeLabels.page') }],
        [t],
    )
    const parentOptions = useMemo(
        () => buildParentOptionsByTypes(availableParents, [PermissionTypeEnum.MENU, PermissionTypeEnum.PAGE]),
        [availableParents],
    )

    const [id, parentCode, status, functions, apis, urlSegment] = watch([
        'id',
        'parentCode',
        'status',
        'functions',
        'apis',
        'urlSegment',
    ])

    const parentUrlBase = useMemo(
        () => availableParents.find(p => p.code === parentCode)?.url ?? '',
        [availableParents, parentCode],
    )

    const visibleFunctions = (functions || []).filter(f => !f._deleted)
    const visibleApis = (apis || []).filter(a => !a._deleted)

    useEffect(() => {
        if (!data) return
        if (id === data.id) return

        setValue('id', data.id, { shouldDirty: false })
        setValue(
            'functions',
            (data.functions || []).map((fn, i) => ({
                _key: `fn_${fn.id}_${fn.code}_${i}`,
                id: fn.id,
                code: fn.code,
                name: fn.name,
                uri: fn.uri || '',
                method: fn.method || '',
                buttonAction: fn.buttonAction || '',
                sortOrder: fn.sortOrder || 0,
                status: fn.status as StatusEnum,
            })),
            { shouldDirty: false },
        )
        setValue(
            'apis',
            (data.apis || []).map((api, i) => ({
                _key: `api_${api.id}_${api.code}_${i}`,
                id: api.id,
                code: api.code,
                name: api.name,
                uri: api.uri || '',
                method: api.method || '',
                sortOrder: api.sortOrder || 0,
                status: api.status as StatusEnum,
            })),
            { shouldDirty: false },
        )
    }, [data, id, setValue])

    const fnKeySeq = useRef(1)
    const apiKeySeq = useRef(1)

    const addFnRow = () => {
        const current = getValues('functions') || []
        setValue(
            'functions',
            [
                ...current,
                {
                    _key: `new_fn_${fnKeySeq.current++}`,
                    code: '',
                    name: '',
                    uri: '',
                    method: 'GET',
                    buttonAction: '',
                    sortOrder: current.length + 1,
                    status: StatusEnum.ACTIVE,
                },
            ],
            { shouldDirty: true, shouldValidate: true },
        )
    }

    const updateFnRow = <K extends keyof FnRow>(key: string, field: K, value: FnRow[K]) => {
        const current = getValues('functions') || []
        const updated = current.map(r => (r._key === key ? { ...r, [field]: value } : r))
        setValue('functions', updated, { shouldDirty: true, shouldValidate: true })
    }

    const deleteFnRow = (key: string) => {
        const current = getValues('functions') || []
        setValue(
            'functions',
            current.map(r => (r._key === key ? { ...r, _deleted: true } : r)),
            { shouldDirty: true, shouldValidate: true },
        )
    }

    const addApiRow = () => {
        const current = getValues('apis') || []
        setValue(
            'apis',
            [
                ...current,
                {
                    _key: `new_api_${apiKeySeq.current++}`,
                    code: '',
                    name: '',
                    uri: '',
                    method: 'GET',
                    sortOrder: current.length + 1,
                    status: StatusEnum.ACTIVE,
                },
            ],
            { shouldDirty: true, shouldValidate: true },
        )
    }

    const updateApiRow = <K extends keyof ApiRow>(key: string, field: K, value: ApiRow[K]) => {
        const current = getValues('apis') || []
        const updated = current.map(r => (r._key === key ? { ...r, [field]: value } : r))
        setValue('apis', updated, { shouldDirty: true, shouldValidate: true })
    }

    const deleteApiRow = (key: string) => {
        const current = getValues('apis') || []
        setValue(
            'apis',
            current.map(r => (r._key === key ? { ...r, _deleted: true } : r)),
            { shouldDirty: true, shouldValidate: true },
        )
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <BsSelect
                    label={t('permission.fields.type')}
                    isRequired
                    isDisabled
                    options={pageTypeSelectOptions}
                    selectedValue={PermissionTypeEnum.PAGE}
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
                <BsInput
                    label={t('permission.fields.name')}
                    isRequired
                    maxLength={200}
                    name="name"
                    containerClassName="col-start-1"
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
                    label={t('permission.fields.method')}
                    name="method"
                    options={HTTP_METHOD_OPTIONS}
                    valueKey="value"
                    labelKey="label"
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.uri')}
                    name="uri"
                    placeholder={t('permission.placeholders.uri')}
                    isDisabled={isReadOnly}
                />
                <BsInput
                    label={t('permission.fields.pathFolder')}
                    maxLength={500}
                    name="pathFolder"
                    isDisabled={isReadOnly}
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

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="size-4 text-green-500" />
                        {t('permission.tables.functions.title', { count: visibleFunctions.length })}
                    </h3>
                    {!isReadOnly && (
                        <Button variant="outline" onPress={addFnRow}>
                            <Plus className="size-3" />
                            {t('permission.actions.addFunction')}
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto rounded-md border">
                    {visibleFunctions.length === 0 ? (
                        <EmptyState
                            variant="compact"
                            title={t('permission.tables.functions.empty')}
                            icon={Zap}
                            className="min-h-[90px]"
                        />
                    ) : (
                        <Table className="min-w-[1500px]">
                            <TableHeader className="z-[30]">
                                <TableRow>
                                    <TableHead className="w-[180px] sticky left-0 z-[40] bg-muted before:absolute before:inset-0 before:bg-muted before:z-[-1] transition-colors after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]">
                                        {t('permission.tables.functions.code')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    <TableHead className="w-[250px]">
                                        {t('permission.tables.functions.name')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    <TableHead className="w-[200px]">
                                        {t('permission.tables.columns.buttonAction')}
                                    </TableHead>
                                    <TableHead className="w-[120px]">{t('permission.fields.method')}</TableHead>
                                    <TableHead className="w-[400px]">{t('permission.fields.uri')}</TableHead>
                                    <TableHead>{t('permission.fields.sortOrder')}</TableHead>
                                    <TableHead className="w-[180px]">
                                        {t('permission.fields.status')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    {!isReadOnly && (
                                        <TableHead className="text-center w-[60px] sticky right-0 z-[40] bg-muted before:absolute before:inset-0 before:bg-muted before:z-[-1] transition-colors after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]">
                                            <Settings className="size-4 mx-auto" />
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleFunctions.map((fn: FnRow) => (
                                    <TableRow key={fn._key}>
                                        <TableCell className="sticky left-0 z-[20] bg-background before:absolute before:inset-0 before:z-[-1] before:bg-background transition-colors group-hover/table-row:bg-muted group-data-[state=selected]/table-row:bg-accent after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]">
                                            <TableInput
                                                value={fn.code}
                                                isDisabled
                                                placeholder="FUNCTION_XXXXXX"
                                                className="font-mono bg-muted/50"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableInput
                                                value={fn.name}
                                                onChange={v => updateFnRow(fn._key, 'name', v)}
                                                placeholder={t('permission.placeholders.name')}
                                                isInvalid={!fn.name}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableInput
                                                value={fn.buttonAction}
                                                onChange={v => updateFnRow(fn._key, 'buttonAction', v)}
                                                placeholder="Action Code"
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableSelect
                                                value={fn.method}
                                                onChange={v => updateFnRow(fn._key, 'method', v)}
                                                options={HTTP_METHOD_OPTIONS}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableInput
                                                value={fn.uri}
                                                onChange={v => updateFnRow(fn._key, 'uri', v)}
                                                placeholder={t('permission.placeholders.uri')}
                                                className="font-mono"
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableNumberInput
                                                value={fn.sortOrder}
                                                onChange={v => updateFnRow(fn._key, 'sortOrder', v as never)}
                                                minValue={0}
                                                className="w-24"
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableSelect
                                                value={fn.status}
                                                onChange={v => updateFnRow(fn._key, 'status', v as never)}
                                                options={STATUS_OPTIONS}
                                                isInvalid={!fn.status}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        {!isReadOnly && (
                                            <TableCell className="sticky right-0 z-[20] bg-background before:absolute before:inset-0 before:z-[-1] before:bg-background transition-colors group-hover/table-row:bg-muted group-data-[state=selected]/table-row:bg-accent after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]">
                                                <Button variant="ghost" onPress={() => deleteFnRow(fn._key)}>
                                                    <Trash2 className="size-3 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="size-4 text-purple-500" />
                        {t('permission.tables.apis.title', { count: visibleApis.length })}
                    </h3>
                    {!isReadOnly && (
                        <Button variant="outline" onPress={addApiRow}>
                            <Plus className="size-3" />
                            {t('permission.actions.addApi')}
                        </Button>
                    )}
                </div>
                <div className="overflow-x-auto rounded-md border">
                    {visibleApis.length === 0 ? (
                        <EmptyState
                            variant="compact"
                            title={t('permission.tables.apis.empty')}
                            icon={Lock}
                            className="min-h-[90px]"
                        />
                    ) : (
                        <Table className="min-w-[1200px]">
                            <TableHeader className="z-[30]">
                                <TableRow>
                                    <TableHead className="w-[180px] sticky left-0 z-[40] bg-muted before:absolute before:inset-0 before:bg-muted before:z-[-1] transition-colors after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]">
                                        {t('permission.tables.apis.code')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    <TableHead className="w-[250px]">
                                        {t('permission.tables.apis.name')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    <TableHead className="w-[120px]">{t('permission.fields.method')}</TableHead>
                                    <TableHead className="w-[400px]">{t('permission.fields.uri')}</TableHead>
                                    <TableHead>{t('permission.fields.sortOrder')}</TableHead>
                                    <TableHead className="w-[180px]">
                                        {t('permission.fields.status')}
                                        <span className="text-red-500 ml-0.5">*</span>
                                    </TableHead>
                                    {!isReadOnly && (
                                        <TableHead className="text-center w-[60px] sticky right-0 z-[40] bg-muted before:absolute before:inset-0 before:bg-muted before:z-[-1] transition-colors after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]">
                                            <Settings className="size-4 mx-auto" />
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleApis.map((api: ApiRow) => (
                                    <TableRow key={api._key}>
                                        <TableCell className="sticky left-0 z-[20] bg-background before:absolute before:inset-0 before:z-[-1] before:bg-background transition-colors group-hover/table-row:bg-muted group-data-[state=selected]/table-row:bg-accent after:absolute after:right-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_-16px_0_0)] group-data-[at-start=false]/table:shadow-[6px_0_8px_0_rgba(0,0,0,0.1)]">
                                            <TableInput
                                                value={api.code}
                                                isDisabled
                                                placeholder="API_XXXXXX"
                                                className="font-mono bg-muted/50"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableInput
                                                value={api.name}
                                                onChange={v => updateApiRow(api._key, 'name', v)}
                                                placeholder={t('permission.placeholders.name')}
                                                isInvalid={!api.name}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableSelect
                                                value={api.method}
                                                onChange={v => updateApiRow(api._key, 'method', v)}
                                                options={HTTP_METHOD_OPTIONS}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableInput
                                                value={api.uri}
                                                onChange={v => updateApiRow(api._key, 'uri', v)}
                                                placeholder={t('permission.placeholders.uri')}
                                                className="font-mono"
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableNumberInput
                                                value={api.sortOrder}
                                                onChange={v => updateApiRow(api._key, 'sortOrder', v as never)}
                                                minValue={0}
                                                className="w-24"
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TableSelect
                                                value={api.status}
                                                onChange={v => updateApiRow(api._key, 'status', v as never)}
                                                options={STATUS_OPTIONS}
                                                isInvalid={!api.status}
                                                isDisabled={isReadOnly}
                                            />
                                        </TableCell>
                                        {!isReadOnly && (
                                            <TableCell className="sticky right-0 z-[20] bg-background before:absolute before:inset-0 before:z-[-1] before:bg-background transition-colors group-hover/table-row:bg-muted group-data-[state=selected]/table-row:bg-accent after:absolute after:left-0 after:top-0 after:h-full after:w-[1px] after:bg-border [clip-path:inset(0_0_0_-16px)] group-data-[at-end=false]/table:shadow-[-6px_0_8px_0_rgba(0,0,0,0.1)]">
                                                <Button variant="ghost" onPress={() => deleteApiRow(api._key)}>
                                                    <Trash2 className="size-3 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    )
}
