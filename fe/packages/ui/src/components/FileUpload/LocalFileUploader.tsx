'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, X, FileSpreadsheet, type LucideIcon } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { toast } from '@workspace/ui/components/Sonner'
import { cn } from '@workspace/ui/lib/utils'

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export interface LocalFileUploaderProps {
    file: File | null
    onChange: (file: File | null) => void
    error?: string | null
    label?: string
    isRequired?: boolean
    accept?: string
    maxSizeMB?: number
    dragLabel?: string
    supportFormatsLabel?: string
    className?: string
    isClearable?: boolean
    variant?: 'dropzone' | 'compact'
    fileIcon?: LucideIcon
    fileIconClassName?: string
}

export function LocalFileUploader({
    file,
    onChange,
    error,
    label,
    isRequired = false,
    accept = '.xlsx, .xls',
    maxSizeMB = 10,
    dragLabel,
    supportFormatsLabel,
    className = '',
    isClearable = true,
    variant = 'dropzone',
    fileIcon: FileIcon = FileSpreadsheet,
    fileIconClassName = 'bg-emerald-50 text-emerald-600',
}: LocalFileUploaderProps) {
    const { t } = useTranslation()
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const selectedFileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (file && selectedFileRef.current) {
            selectedFileRef.current.focus()
        }
    }, [file])

    const handleProcessFile = (selectedFile: File) => {
        const maxSizeByte = maxSizeMB * 1024 * 1024
        if (selectedFile.size > maxSizeByte) {
            toast.error({
                title: t('common.errors.fileTooLarge', { max: maxSizeMB }),
            })
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }
        onChange(selectedFile)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            handleProcessFile(selectedFile)
        }
        e.target.value = ''
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            handleProcessFile(droppedFile)
        }
    }

    const resolvedDragLabel = dragLabel || t('common.uploader.dragLabel')
    const resolvedSupportFormats = supportFormatsLabel || t('common.uploader.supportFormats')

    return (
        <div className={cn('group/uploader flex flex-col gap-1.5', className)}>
            {label && (
                <span
                    className={cn(
                        'text-sm font-semibold transition-colors',
                        error
                            ? 'text-destructive'
                            : 'text-slate-700 group-hover/uploader:text-primary group-focus-within/uploader:text-primary',
                    )}
                >
                    {label} {isRequired && <span className="text-destructive">*</span>}
                </span>
            )}

            <input type="file" ref={fileInputRef} className="hidden" accept={accept} onChange={handleFileChange} />

            {!file && variant === 'compact' ? (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        'flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed',
                        'py-2 text-sm outline-none transition-all duration-200',
                        error
                            ? 'border-destructive text-destructive'
                            : isDragging
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/50 hover:bg-muted/30 hover:text-primary',
                    )}
                >
                    <Upload className="size-4" />
                    <span>{resolvedDragLabel}</span>
                </button>
            ) : !file ? (
                <div
                    tabIndex={0}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => {
                        if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            fileInputRef.current?.click()
                        }
                    }}
                    className={cn(
                        'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 px-4 text-center cursor-pointer transition-all duration-200 outline-none',
                        error
                            ? 'border-destructive bg-destructive/10'
                            : isDragging
                              ? 'border-primary bg-primary/5'
                              : 'border-input hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:bg-primary/5 group-hover/uploader:border-primary group-hover/uploader:bg-primary/5',
                    )}
                >
                    <div
                        className={cn(
                            'flex items-center justify-center size-10 rounded-full transition-colors',
                            error
                                ? 'bg-destructive/20 text-destructive'
                                : cn(
                                      'bg-slate-100 text-slate-600 group-hover/uploader:bg-primary/20 group-hover/uploader:text-primary group-focus-within/uploader:bg-primary/20 group-focus-within/uploader:text-primary',
                                      isDragging && 'bg-primary/20 text-primary',
                                  ),
                        )}
                    >
                        <Upload className="size-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span
                            className={cn(
                                'text-xs font-bold transition-colors',
                                error
                                    ? 'text-destructive'
                                    : cn(
                                          'text-slate-800 group-hover/uploader:text-primary group-focus-within/uploader:text-primary',
                                          isDragging && 'text-primary',
                                      ),
                            )}
                        >
                            {resolvedDragLabel}
                        </span>
                        <span
                            className={cn(
                                'text-[10px] font-medium transition-colors',
                                error
                                    ? 'text-destructive/70'
                                    : cn(
                                          'text-slate-500 group-hover/uploader:text-primary/70 group-focus-within/uploader:text-primary/70',
                                          isDragging && 'text-primary/70',
                                      ),
                            )}
                        >
                            {resolvedSupportFormats}
                        </span>
                    </div>
                </div>
            ) : (
                <div
                    ref={selectedFileRef}
                    tabIndex={0}
                    className={cn(
                        'flex items-center justify-between rounded-xl p-3 bg-card shadow-sm transition-all duration-200 ring-inset border-0 outline-none',
                        error
                            ? 'ring-2 ring-destructive bg-destructive/10'
                            : 'ring ring-input group-hover/uploader:ring-2 group-hover/uploader:ring-primary group-hover/uploader:bg-primary/5 group-focus-within/uploader:ring-2 group-focus-within/uploader:ring-primary group-focus-within/uploader:bg-primary/5',
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={cn(
                                'flex items-center justify-center size-9.5 rounded-lg transition-colors',
                                error
                                    ? 'bg-destructive/20 text-destructive'
                                    : cn(
                                          fileIconClassName,
                                          'group-hover/uploader:bg-primary/20 group-hover/uploader:text-primary group-focus-within/uploader:bg-primary/20 group-focus-within/uploader:text-primary',
                                      ),
                            )}
                        >
                            <FileIcon className="size-5" />
                        </div>
                        <div className="flex flex-col min-w-0 leading-tight">
                            <span
                                className={cn(
                                    'text-xs font-semibold truncate transition-colors',
                                    error
                                        ? 'text-destructive'
                                        : 'text-slate-800 group-hover/uploader:text-primary group-focus-within/uploader:text-primary',
                                )}
                            >
                                {file.name}
                            </span>
                            <span
                                className={cn(
                                    'text-[10px] font-medium transition-colors',
                                    error
                                        ? 'text-destructive/70'
                                        : 'text-slate-500 group-hover/uploader:text-primary/70 group-focus-within/uploader:text-primary/70',
                                )}
                            >
                                {formatBytes(file.size)}
                            </span>
                        </div>
                    </div>
                    {isClearable && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'size-8 cursor-pointer shrink-0',
                                error
                                    ? 'text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15'
                                    : 'text-slate-400 hover:bg-primary/10 hover:text-primary active:bg-primary/15 focus-visible:text-primary group-hover/uploader:text-primary group-focus-within/uploader:text-primary',
                            )}
                            onClick={e => {
                                e.stopPropagation()
                                onChange(null)
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = ''
                                }
                            }}
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            )}
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
    )
}
