export interface UploaderFile {
    /** The unique identifier for the file. */
    id: string

    /** The size of the file. */
    size: number

    /** The name of the file. */
    name: string

    /** MIME type of the file. */
    type: string

    /** The extension of the file. Eg: 'png', 'pdf', etc.*/
    extension: string

    /** The URL of the file. */
    url?: string

    /** The status of the file upload. */
    status?: 'done' | 'error' | 'uploading'

    /** The percent of the file upload. */
    percent?: number

    /** The thumbnail URL of the file. */
    thumbUrl?: string

    /** The error message of the file upload. */
    error?: any

    /** The file. */
    file?: File

    /** The abort controller for canceling the upload request. */
    abortController?: AbortController
}

export interface UploaderItemProps {
    uploaderFile: UploaderFile
    onDelete: (uploaderFile: UploaderFile) => void
    onRetry: (uploaderFile: UploaderFile) => void
    variant?: 'list' | 'card'
    isDisabled?: boolean
}

export interface UploaderTriggerProps {
    onDrop: (files: Array<File>) => void
    acceptedFileExtensions?: string[]
    maxFileSize?: number
    allowMultiple?: boolean
    triggerType?: 'button' | 'dropzone'
    isDisabled?: boolean
    isInvalid?: boolean
}

/**
 * The following rules are utilized to check files for validity prior to upload,
 * they determine which files are acceptable during the selection process.
 */
export interface UploaderRules {
    acceptedFileExtensions?: Array<string>
    maxFileSize?: number
    maxFiles?: number
    allowMultiple: boolean
}

export interface UploaderProps {
    /** The action to upload the files. */
    action: any // UploaderAction (class, not extractable as pure type)

    /** The value of the uploader. */
    defaultFileList?: Array<UploaderFile>

    /** The onChange handler to update the value of the uploader. */
    onFileListChange?: (fileList: Array<UploaderFile>) => void

    /** The list type to display the files. */
    listType?: 'list' | 'card'

    /** The trigger type to display the uploader. */
    triggerType?: UploaderTriggerProps['triggerType']

    /** Array of allowed file extensions. */
    acceptedFileExtensions?: UploaderRules['acceptedFileExtensions']

    /** The maximum number of files to upload. */
    maxFiles?: UploaderRules['maxFiles']

    /** The maximum file size to upload. In bytes. */
    maxFileSize?: UploaderRules['maxFileSize']

    /** Whether multiple files can be chosen at once. */
    allowMultiple?: UploaderRules['allowMultiple']

    /** Whether the uploader is disabled. */
    isDisabled?: boolean

    /** Whether the uploader is invalid. */
    'aria-invalid'?: boolean
}
