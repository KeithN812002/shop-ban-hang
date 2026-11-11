import { useState, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDialogTitle } from '@/hooks'
import { AlertTriangle, Check, CheckCircle2, MinusCircle, PencilLine, PlusCircle, ShieldAlert } from 'lucide-react'
import { FormDialogContent } from '@workspace/ui/components/DataTable'
import { LocalFileUploader } from '@workspace/ui/components/FileUpload'
import { LoadingOverlay } from '@workspace/ui/components/LoadingOverlay'
import { confirm } from '@workspace/ui/components/ConfirmDialog'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import { ActionButton } from '@/components/Common/ActionButton'
import type { PermissionImportApplyScope, PermissionImportItemSummary, PermissionImportPreviewResponse } from '../types'
import { usePreviewPermissionImport, useApplyPermissionImport } from '../hooks'

const FULL_SCOPE: PermissionImportApplyScope = { applyAdd: true, applyUpdate: true, applyDelete: true }

interface PermissionImportDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onImported: () => void
}

export const PermissionImportDialog = memo(({ isOpen, onOpenChange, onImported }: PermissionImportDialogProps) => {
    const { t } = useTranslation()
    const dialogTitle = useDialogTitle()
    const [file, setFile] = useState<File | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const [preview, setPreview] = useState<PermissionImportPreviewResponse | null>(null)
    const [scope, setScope] = useState<PermissionImportApplyScope>(FULL_SCOPE)

    const previewMutation = usePreviewPermissionImport()
    const applyMutation = useApplyPermissionImport()

    const isPending = previewMutation.isPending || applyMutation.isPending
    const step = preview ? 'preview' : 'upload'
    const hasBlockers = (preview?.blockers.length ?? 0) > 0
    const changeCount = preview ? preview.toAdd.length + preview.toUpdate.length + preview.toDelete.length : 0

    const selectedCounts = {
        added: scope.applyAdd ? (preview?.toAdd.length ?? 0) : 0,
        updated: scope.applyUpdate ? (preview?.toUpdate.length ?? 0) : 0,
        deleted: scope.applyDelete ? (preview?.toDelete.length ?? 0) : 0,
        cut: scope.applyDelete ? (preview?.roleAssignmentsToDelete ?? 0) : 0,
    }
    const selectedChangeCount = selectedCounts.added + selectedCounts.updated + selectedCounts.deleted

    useEffect(() => {
        if (isOpen) {
            setFile(null)
            setFileError(null)
            setPreview(null)
            setScope(FULL_SCOPE)
        }
    }, [isOpen])

    const handleClose = () => {
        setFile(null)
        setFileError(null)
        setPreview(null)
        setScope(FULL_SCOPE)
        onOpenChange(false)
    }

    const handlePreview = async () => {
        if (!file) {
            setFileError(t('permission.import.fileRequired'))
            return
        }
        setFileError(null)
        try {
            const result = await previewMutation.mutateAsync(file)
            if (result) {
                setPreview(result)
                setScope(FULL_SCOPE)
            }
        } catch {
            // Error handled by mutation meta
        }
    }

    const runApply = async () => {
        if (!file || !preview) return
        try {
            await applyMutation.mutateAsync({
                file,
                confirmDeleteCount: selectedCounts.cut,
                scope,
            })
            onImported()
            handleClose()
        } catch {
            // Error handled by mutation meta
        }
    }

    const handleApply = () => {
        if (!preview) return

        const counts = selectedCounts
        const hasRemoval = counts.deleted > 0 || counts.cut > 0

        confirm({
            title: t('permission.import.confirmTitle'),
            description: hasRemoval
                ? t('permission.import.confirmDescriptionWithCut', counts)
                : t('permission.import.confirmDescription', counts),
            variant: 'warning',
            action: {
                label: t('permission.import.btnApply'),
                onClick: () => {
                    void runApply()
                },
            },
        })
    }

    const handleFileChange = (selectedFile: File | null) => {
        setFile(selectedFile)
        setFileError(null)
        setPreview(null)
    }

    const handleBack = () => {
        setPreview(null)
    }

    return (
        <FormDialogContent
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 'upload' ? dialogTitle('import') : t('permission.import.previewTitle')}
            isPending={isPending}
            columns={1}
            className={step === 'preview' ? 'max-w-[900px]' : 'max-w-[480px]'}
            bodyClassName={step === 'preview' ? 'block max-h-[70vh] overflow-y-auto' : undefined}
            t={t}
            footer={
                step === 'upload' ? (
                    <ActionButton
                        type="button"
                        variant="default"
                        onPress={() => void handlePreview()}
                        icon={Check}
                        label={t('permission.import.btnPreview')}
                    />
                ) : (
                    <div className="flex justify-end gap-2 w-full">
                        <ActionButton type="button" variant="outline" onPress={handleBack} actionType="back" />
                        <ActionButton
                            type="button"
                            variant={selectedCounts.cut > 0 ? 'warning' : 'default'}
                            onPress={handleApply}
                            isDisabled={hasBlockers || selectedChangeCount === 0}
                            icon={Check}
                            label={t('permission.import.btnApply')}
                        />
                    </div>
                )
            }
        >
            <LoadingOverlay isLoading={isPending} isFullScreen={isPending} text={`${t('common.processing')}...`}>
                {step === 'upload' && (
                    <LocalFileUploader
                        file={file}
                        onChange={handleFileChange}
                        error={fileError}
                        label={t('permission.import.fileLabel')}
                        isRequired
                        accept=".json"
                        maxSizeMB={10}
                        supportFormatsLabel={t('permission.import.supportFormats')}
                    />
                )}

                {step === 'preview' && preview && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-4 gap-3">
                            <SummaryTile
                                label={t('permission.import.summary.fileCount')}
                                value={preview.fileCount}
                                tone="neutral"
                            />
                            <SummaryTile
                                label={t('permission.import.summary.toAdd')}
                                value={preview.toAdd.length}
                                tone="add"
                            />
                            <SummaryTile
                                label={t('permission.import.summary.toUpdate')}
                                value={preview.toUpdate.length}
                                tone="update"
                            />
                            <SummaryTile
                                label={t('permission.import.summary.toDelete')}
                                value={preview.toDelete.length}
                                tone="delete"
                            />
                        </div>

                        {!hasBlockers && changeCount === 0 && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-2.5">
                                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-emerald-700">
                                        {t('permission.import.noChangesTitle')}
                                    </span>
                                    <span className="text-xs text-emerald-700/80 font-medium">
                                        {t('permission.import.noChangesDescription')}
                                    </span>
                                </div>
                            </div>
                        )}

                        {hasBlockers && (
                            <Section
                                icon={ShieldAlert}
                                tone="blocker"
                                title={t('permission.import.blockersTitle')}
                                count={preview.blockers.length}
                            >
                                <ul className="list-disc pl-5 space-y-1">
                                    {preview.blockers.map(blocker => (
                                        <li key={blocker} className="text-xs text-destructive font-medium">
                                            {blocker}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {!hasBlockers && changeCount > 0 && (
                            <span className="text-xs font-medium text-slate-500">
                                {t('permission.import.applyScopeHint')}
                            </span>
                        )}

                        {scope.applyDelete && preview.roleAssignmentsToDelete > 0 && (
                            <div className="rounded-lg bg-amber-500 px-4 py-3 flex items-start gap-2.5 text-white">
                                <AlertTriangle className="size-5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold">
                                        {t('permission.import.cutTitle')} ({preview.roleAssignmentsToDelete})
                                    </span>
                                    <span className="text-xs font-medium text-white/90">
                                        {t('permission.import.cutDescription', {
                                            count: preview.roleAssignmentsToDelete,
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}

                        {preview.renameHints.length > 0 && (
                            <Section
                                icon={AlertTriangle}
                                tone="update"
                                title={t('permission.import.renameTitle')}
                                count={preview.renameHints.length}
                            >
                                <ul className="space-y-1">
                                    {preview.renameHints.map(hint => (
                                        <li
                                            key={`${hint.currentCode}-${hint.incomingCode}`}
                                            className="text-xs text-amber-700 font-medium"
                                        >
                                            <span className="font-mono">{hint.currentCode}</span>
                                            {' → '}
                                            <span className="font-mono">{hint.incomingCode}</span>
                                            {hint.uri ? <span className="text-slate-500"> ({hint.uri})</span> : null}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {preview.uriWarnings?.length > 0 && (
                            <Section
                                icon={AlertTriangle}
                                tone="update"
                                title={t('permission.import.uriWarningsTitle')}
                                count={preview.uriWarnings.length}
                            >
                                <ul className="list-disc pl-5 space-y-1">
                                    {preview.uriWarnings.map(warning => (
                                        <li key={warning} className="text-xs text-amber-700 font-medium font-mono">
                                            {warning}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {preview.toAdd.length > 0 && (
                            <Section
                                icon={PlusCircle}
                                tone="add"
                                title={t('permission.import.summary.toAdd')}
                                count={preview.toAdd.length}
                                isSelected={scope.applyAdd}
                                onSelectedChange={applyAdd => setScope(prev => ({ ...prev, applyAdd }))}
                            >
                                <ul className="space-y-1.5">
                                    {preview.toAdd.map(item => (
                                        <li key={item.code} className="text-xs">
                                            <ItemHeading item={item} />
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {preview.toUpdate.length > 0 && (
                            <Section
                                icon={PencilLine}
                                tone="update"
                                title={t('permission.import.summary.toUpdate')}
                                count={preview.toUpdate.length}
                                isSelected={scope.applyUpdate}
                                onSelectedChange={applyUpdate => setScope(prev => ({ ...prev, applyUpdate }))}
                            >
                                <ul className="space-y-2.5">
                                    {preview.toUpdate.map(item => (
                                        <li key={item.code} className="text-xs">
                                            <div>
                                                <span className="font-mono font-semibold">{item.code}</span>
                                                {item.moduleCode ? (
                                                    <span className="text-slate-500"> [{item.moduleCode}]</span>
                                                ) : null}
                                                <span className="text-slate-600"> — {item.name}</span>
                                            </div>
                                            <table className="mt-1 ml-3 border-separate border-spacing-x-2">
                                                <tbody>
                                                    {item.changes.map(change => (
                                                        <tr key={change.field}>
                                                            <td className="align-top whitespace-nowrap font-semibold text-slate-500">
                                                                {t(
                                                                    `permission.import.fields.${change.field}`,
                                                                    change.field,
                                                                )}
                                                            </td>
                                                            <td className="align-top text-slate-500">
                                                                <FieldValue value={change.oldValue} />
                                                            </td>
                                                            <td className="align-top text-slate-400">→</td>
                                                            <td className="align-top font-semibold text-amber-700">
                                                                <FieldValue value={change.newValue} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {preview.toDelete.length > 0 && (
                            <Section
                                icon={MinusCircle}
                                tone="delete"
                                title={t('permission.import.summary.toDelete')}
                                count={preview.toDelete.length}
                                isSelected={scope.applyDelete}
                                onSelectedChange={applyDelete => setScope(prev => ({ ...prev, applyDelete }))}
                            >
                                <ul className="space-y-2">
                                    {preview.toDelete.map(item => (
                                        <li key={item.code} className="text-xs">
                                            <ItemHeading item={item} />
                                            {item.roles.length > 0 && (
                                                <div className="mt-0.5 pl-3 font-semibold text-red-700">
                                                    {t('permission.import.rolesAffected')}:{' '}
                                                    {item.roles
                                                        .map(role =>
                                                            role.name ? `${role.code} — ${role.name}` : role.code,
                                                        )
                                                        .join(', ')}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                    </div>
                )}
            </LoadingOverlay>
        </FormDialogContent>
    )
})

type Tone = 'neutral' | 'add' | 'update' | 'delete' | 'blocker'

const TONE_CLASS: Record<Tone, string> = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
    add: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    update: 'bg-amber-50 border-amber-200 text-amber-700',
    delete: 'bg-red-50 border-red-200 text-red-700',
    blocker: 'bg-destructive/5 border-destructive/30 text-destructive',
}

const SummaryTile = ({ label, value, tone }: { label: string; value: number; tone: Tone }) => (
    <div className={`rounded-lg border px-3 py-2 flex flex-col gap-0.5 ${TONE_CLASS[tone]}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
        <span className="text-lg font-bold leading-none">{value}</span>
    </div>
)

const Section = ({
    icon: Icon,
    tone,
    title,
    count,
    isSelected,
    onSelectedChange,
    children,
}: {
    icon: React.ElementType
    tone: Tone
    title: string
    count: number
    isSelected?: boolean
    onSelectedChange?: (selected: boolean) => void
    children: React.ReactNode
}) => {
    return (
        <div className={`rounded-lg border p-3 ${TONE_CLASS[tone]}`}>
            <div className="flex items-center gap-1.5 mb-2">
                <Icon className="size-4" />
                <span className="text-xs font-bold">
                    {title} ({count})
                </span>
                {onSelectedChange && (
                    <Checkbox
                        aria-label={title}
                        isSelected={isSelected}
                        onChange={onSelectedChange}
                        className="ml-auto"
                    />
                )}
            </div>
            <div className={onSelectedChange && !isSelected ? 'opacity-50' : undefined}>{children}</div>
        </div>
    )
}

const ItemHeading = ({ item }: { item: PermissionImportItemSummary }) => (
    <>
        <div>
            <span className="font-mono font-semibold">{item.code}</span>
            {item.moduleCode ? <span className="text-slate-500"> [{item.moduleCode}]</span> : null}
            <span className="text-slate-600"> — {item.name}</span>
        </div>
        <div className="pl-3 text-slate-500">
            {item.parentCode ? <span className="font-mono">{item.parentCode}</span> : null}
            {item.uri ? <span className="font-mono"> · {item.uri}</span> : null}
            {item.buttonAction ? <span className="font-mono"> · {item.buttonAction}</span> : null}
        </div>
    </>
)

const FieldValue = ({ value }: { value?: string | null }) => {
    const { t } = useTranslation()
    if (value === null || value === undefined || value === '') {
        return <span className="italic opacity-60">{t('permission.import.emptyValue')}</span>
    }
    return <span className="font-mono break-all">{value}</span>
}

PermissionImportDialog.displayName = 'PermissionImportDialog'
