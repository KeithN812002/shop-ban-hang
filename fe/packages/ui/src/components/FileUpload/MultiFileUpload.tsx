import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2, Plus, FileText, FileImage, FileCode } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { toast } from '@workspace/ui/components/Sonner'
import { FileMetadata, FileUploadServiceProps } from './FileUpload.types'

interface MultiFileUploadProps extends FileUploadServiceProps {
    files: any[]
    bucketName: string
    onUploadSuccess: (metadatas: FileMetadata[]) => void
    onDeleteSuccess: (fileId: string) => void
    isDisabled?: boolean
    isInvalid?: boolean
    className?: string
    maxFiles?: number
    maxSizeMB?: number
    allowedExtensions?: string[]
}

const getFileIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="size-3.5 text-red-500" />
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || ''))
        return <FileImage className="size-3.5 text-blue-500" />
    return <FileCode className="size-3.5 text-primary/70" />
}

export function MultiFileUpload({
    files = [],
    bucketName,
    onUploadSuccess,
    onDeleteSuccess,
    isDisabled = false,
    isInvalid = false,
    className = '',
    maxFiles = 5,
    maxSizeMB = 10,
    uploadFile,
    downloadFile,
    deleteFile,
    allowedExtensions = [
        '.xlsx',
        '.xls',
        '.doc',
        '.docx',
        '.png',
        '.jpg',
        '.jpeg',
        '.pdf',
        '.txt',
        '.csv',
        '.zip',
        '.rar',
    ],
}: MultiFileUploadProps) {
    const { t } = useTranslation()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files
        if (!selectedFiles || selectedFiles.length === 0) return

        const totalFilesAfterUpload = files.length + selectedFiles.length
        if (totalFilesAfterUpload > maxFiles) {
            toast.error({ title: t('common.errors.maxFilesExceeded', { max: maxFiles }) })
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        const maxSizeByte = maxSizeMB * 1024 * 1024
        for (let i = 0; i < selectedFiles.length; i++) {
            const fileName = selectedFiles[i].name
            const ext = '.' + fileName.split('.').pop()?.toLowerCase()
            if (!allowedExtensions.includes(ext)) {
                toast.error({
                    title: t('common.errors.invalidFileType', {
                        allowed: allowedExtensions.join(', '),
                    }),
                })
                if (fileInputRef.current) fileInputRef.current.value = ''
                return
            }
            if (selectedFiles[i].size > maxSizeByte) {
                toast.error({ title: t('common.errors.fileTooLarge', { max: maxSizeMB }) })
                if (fileInputRef.current) fileInputRef.current.value = ''
                return
            }
        }

        setIsUploading(true)
        const results: FileMetadata[] = []
        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                const metadata = await uploadFile(selectedFiles[i], bucketName)
                results.push(metadata)
            }
            onUploadSuccess(results)
        } catch (error) {
            console.error('File upload failed', error)
            toast.error({ title: t('common.errors.uploadFailed') })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDeleteFile = useCallback(
        async (fileId: string) => {
            if (isDisabled) return
            try {
                if (deleteFile) {
                    await deleteFile(fileId)
                }
                onDeleteSuccess(fileId)
            } catch (error) {
                console.error('File delete failed', error)
                toast.error({ title: t('common.errors.deleteFailed') })
            }
        },
        [isDisabled, onDeleteSuccess, deleteFile, t],
    )

    const handleDownload = useCallback(
        async (fileId: string, fileName: string) => {
            if (!downloadFile) return
            try {
                await downloadFile(fileId, fileName)
            } catch (error) {
                console.error('File download failed', error)
                toast.error({ title: t('common.errors.downloadFailed') })
            }
        },
        [downloadFile, t],
    )

    return (
        <div className={`flex flex-col gap-1.5 w-full ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
                disabled={isDisabled || isUploading}
                accept={allowedExtensions.join(',')}
            />

            {/* Upload Trigger - MOVED TO TOP */}
            {!isDisabled && files.length < maxFiles && (
                <div
                    onClick={() => !isDisabled && !isUploading && fileInputRef.current?.click()}
                    className={`
                        flex items-center justify-center gap-2 px-3 py-1.5 rounded-md border border-dashed transition-all duration-200 h-8
                        ${
                            isDisabled || isUploading
                                ? 'opacity-50 cursor-not-allowed bg-muted/20 border-muted-foreground/10'
                                : isInvalid
                                  ? 'border-destructive/40 bg-destructive/5 cursor-pointer hover:bg-destructive/10 hover:border-destructive/60'
                                  : 'border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 hover:border-primary/40'
                        }
                    `}
                >
                    {isUploading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
                                {t('common.uploading')}...
                            </span>
                        </div>
                    ) : (
                        <div className={`flex items-center gap-2 ${isInvalid ? 'text-destructive' : 'text-primary'}`}>
                            <Plus className="size-4" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">
                                {files.length > 0
                                    ? `${t('common.uploadMore')} (${files.length}/${maxFiles})`
                                    : t('common.upload')}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* File List - MOVED TO BOTTOM */}
            {files.length > 0 && (
                <div className="flex flex-col gap-1">
                    {files.map((file, index) => (
                        <div
                            key={file.id || index}
                            className={`group relative flex items-center justify-between px-2 py-1 rounded-md border bg-card hover:bg-accent/50 transition-all duration-200 h-8 shadow-sm overflow-hidden ${isInvalid ? 'border-destructive/30' : 'border-primary/10 hover:border-primary/30'}`}
                        >
                            <div
                                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer pr-6"
                                onClick={() => file.id && file.fileName && handleDownload(file.id, file.fileName)}
                            >
                                <div className="flex-shrink-0">{getFileIcon(file.fileName)}</div>
                                <span
                                    className="text-[11px] font-medium truncate text-foreground group-hover:text-primary transition-colors"
                                    title={file.fileName}
                                >
                                    {file.fileName}
                                </span>
                            </div>

                            {!isDisabled && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0.5 top-1/2 -translate-y-1/2 size-6 transition-all text-destructive/70 hover:text-destructive"
                                    onClick={e => {
                                        e.stopPropagation()
                                        if (file.id) handleDeleteFile(file.id)
                                    }}
                                    isDisabled={isDisabled}
                                >
                                    <X className="size-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
