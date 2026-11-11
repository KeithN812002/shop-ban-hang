import { toast } from '@workspace/ui/components/Sonner'

// Thin wrapper over the shared toast so call sites only pass a message.
export const notify = {
    success: (title: string, description?: string) => toast.success({ title, description }, { position: 'top-center' }),
    error: (title: string, description?: string) => toast.error({ title, description }, { position: 'top-center' }),
    info: (title: string, description?: string) => toast.info({ title, description }, { position: 'top-center' }),
}
