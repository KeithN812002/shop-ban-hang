import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, Loader2, X, FileText, FileImage, FileCode, Plus } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { toast } from '@workspace/ui/components/Sonner'
import { FileMetadata, FileUploadServiceProps } from './FileUpload.types'

interface FileUploadProps extends FileUploadServiceProps {
    fileId?: string
    fileName?: string
    bucketName: string
    onUploadSuccess: (metadata: FileMetadata) => void
    onDeleteSuccess: () => void
    isDisabled?: boolean
    isInvalid?: boolean
    className?: string
    maxSizeMB?: number
}

const getFileIcon = (fileName?: string) => {
    if (!fileName) return <Paperclip className="size-4" />
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="size-4 text-red-500" />
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImage className="size-4 text-blue-500" />
    return <FileCode className="size-4 text-primary" />
}

export function FileUpload({
    fileId,
    fileName,
    bucketName,
    onUploadSuccess,
    onDeleteSuccess,
    isDisabled = false,
    isInvalid = false,
    className = '',
    maxSizeMB = 10,
    uploadFile,
    downloadFile,
    deleteFile,
}: FileUploadProps) {
    const { t } = useTranslation()
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement> | File) => {
        const file = event instanceof File ? event : event.target.files?.[0]
        if (!file) return

        // Check file size limit
        const maxSizeByte = maxSizeMB * 1024 * 1024
        if (file.size > maxSizeByte) {
            toast.error({ title: '', description: t('common.errors.fileTooLarge', { max: maxSizeMB }) })
            if (!(event instanceof File) && fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        setIsUploading(true)
        try {
            const metadata = await uploadFile(file, bucketName)
            onUploadSuccess(metadata)
        } catch (error) {
            console.error('File upload failed', error)
            toast.error({ title: '', description: t('common.errors.uploadFailed') })
        } finally {
            setIsUploading(false)
            if (!(event instanceof File) && fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (fileId && fileName && downloadFile) {
            try {
                await downloadFile(fileId, fileName)
            } catch (error) {
                console.error('File download failed', error)
                toast.error({ title: '', description: t('common.errors.downloadFailed') })
            }
        }
    }

    const handleDeleteFile = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (fileId && deleteFile) {
            try {
                await deleteFile(fileId)
                onDeleteSuccess()
            } catch (error) {
                console.error('File delete failed', error)
                toast.error({ title: '', description: t('common.errors.deleteFailed') })
            }
        } else {
            onDeleteSuccess()
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!isDisabled && !isUploading) setIsDragging(true)
    }

    const onDragLeave = () => {
        setIsDragging(false)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (isDisabled || isUploading) return

        const file = e.dataTransfer.files[0]
        if (file) handleFileChange(file)
    }

    return (
        <div className={`w-full ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={isDisabled || isUploading}
            />

            {!fileName && !isDisabled ? (
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        group relative flex items-center justify-center gap-2 px-3 rounded-md border border-dashed transition-all duration-200 cursor-pointer h-8
                        ${
                            isDragging
                                ? 'border-primary bg-primary/5'
                                : isInvalid
                                  ? 'border-destructive bg-destructive/5'
                                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                        }
                        ${isDisabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="size-3 animate-spin text-primary" />
                            <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                {t('common.uploading')}...
                            </span>
                        </div>
                    ) : (
                        <div
                            className={`flex items-center gap-2 transition-colors ${isInvalid ? 'text-destructive' : 'text-muted-foreground group-hover:text-primary'}`}
                        >
                            <Plus className="size-3.5" />
                            <span className="text-[11px] font-semibold leading-none capitalize">
                                {t('common.upload')}
                            </span>
                        </div>
                    )}
                </div>
            ) : !fileName && isDisabled ? (
                <div className="text-xs italic text-muted-foreground flex items-center gap-2 px-3 h-8 bg-muted/20 border rounded-md border-dashed">
                    {t('common.noFileAttached', 'Chưa đính kèm file')}
                </div>
            ) : (
                <div
                    onClick={handleDownload}
                    className={`group relative flex items-center justify-between px-2 rounded-md border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer h-8 shadow-sm overflow-hidden ${isInvalid ? 'border-destructive' : 'border-primary/20 hover:border-primary/50'}`}
                >
                    <div className="flex items-center gap-1.5 min-w-0 pr-6">
                        <div className="flex-shrink-0">{getFileIcon(fileName)}</div>
                        <div className="flex flex-col min-w-0 leading-tight">
                            <span
                                className={`text-[10px] font-medium truncate transition-colors ${isInvalid ? 'text-destructive' : 'text-foreground group-hover:text-primary'}`}
                            >
                                {fileName}
                            </span>
                            <span className="text-[7px] text-muted-foreground/70 uppercase font-black tracking-tighter">
                                {fileName?.split('.').pop()}
                            </span>
                        </div>
                    </div>

                    {!isDisabled && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-1/2 -translate-y-1/2 size-5.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={handleDeleteFile}
                            isDisabled={isDisabled}
                        >
                            <X className="size-3" />
                        </Button>
                    )}

                    <div
                        className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ${isInvalid ? 'bg-destructive/50' : 'bg-primary/20'}`}
                    />
                </div>
            )}
        </div>
    )
}
