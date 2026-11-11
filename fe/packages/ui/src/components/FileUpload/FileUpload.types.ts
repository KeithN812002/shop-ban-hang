export interface FileMetadata {
    id?: string
    fileId?: string
    originalName?: string
    fileName?: string // Alias if needed
    bucketName?: string
    fileSize?: number
    fileType?: string
    filePath?: string
    createdBy?: string
    createdDate?: string
}

export interface FileUploadServiceProps {
    uploadFile: (file: File, bucketName: string) => Promise<FileMetadata>
    downloadFile?: (id: string, fileName: string) => Promise<void>
    deleteFile?: (id: string) => Promise<void>
}
