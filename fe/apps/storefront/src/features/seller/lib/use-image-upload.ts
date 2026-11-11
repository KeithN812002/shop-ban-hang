import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_IMAGE_BYTES } from '@/components/common/image-uploader'
import { uploadImage } from '@/features/account/api'
import { getErrorMessage } from '@/lib/http'
import { notify } from '@/lib/notify'

interface UploadOptions {
    /** Extra MIME type whitelist (e.g. ['image/png']); defaults to any image/*. */
    accept?: string[]
}

/**
 * Validates (type, <= 5MB) and uploads files to POST /shop/me/file/upload one by one.
 * Returns the URLs that succeeded; failures are toasted and skipped, never thrown.
 */
export function useImageUpload() {
    const { t } = useTranslation()
    const [pending, setPending] = useState(0)

    const upload = useCallback(
        async (files: File[], { accept }: UploadOptions = {}): Promise<string[]> => {
            const urls: string[] = []
            for (const file of files) {
                const typeOk = accept ? accept.includes(file.type) : file.type.startsWith('image/')
                if (!typeOk) {
                    notify.error(t('seller.upload.badType', { name: file.name }))
                    continue
                }
                if (file.size > MAX_IMAGE_BYTES) {
                    notify.error(t('seller.upload.tooLarge', { name: file.name }))
                    continue
                }
                setPending(n => n + 1)
                try {
                    const { url } = await uploadImage(file)
                    urls.push(url)
                } catch (error) {
                    notify.error(getErrorMessage(error, t('seller.upload.failed', { name: file.name })))
                } finally {
                    setPending(n => n - 1)
                }
            }
            return urls
        },
        [t],
    )

    return { upload, pending, isUploading: pending > 0 }
}
