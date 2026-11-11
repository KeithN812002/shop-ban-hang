import { matchQuery, MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BsProvider } from '@workspace/ui/components/Provider'
import { ThemeProvider } from '@/shared/components/ThemeProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { MenuDataProvider } from '@/providers/MenuDataProvider'
import { toast } from '@workspace/ui/components/Sonner'
import i18n from '@/i18n/config'
import { getErrorMessage } from '@/utils/api.utils'
import { useForbiddenStore } from '@/stores/useForbiddenStore'

const handleGlobalError = (error: any) => {
    const { message: rawMessage, traceId, errorType, validationData } = getErrorMessage(error, i18n.t('common.error'))
    const message = i18n.exists(rawMessage) ? i18n.t(rawMessage) : rawMessage

    const isWarning = errorType === 'VALIDATION' || errorType === 'BUSINESS' || errorType === 'AUTHORIZATION_WARNING'
    const showToast = isWarning ? toast.warning : toast.error
    const title = isWarning ? i18n.t('common.warning') : i18n.t('common.error')

    showToast({
        title,
        description: (
            <div className="flex flex-col gap-1">
                <span className={isWarning ? 'font-medium' : ''}>{message}</span>
                {errorType === 'VALIDATION' && validationData && Array.isArray(validationData) && (
                    <ul className="list-disc list-inside text-[11px] mt-1 border-t pt-1 border-foreground/10 space-y-0.5">
                        {validationData.map((err: any, index: number) => (
                            <li key={index}>
                                <span className="font-semibold">{err.field}</span>: {err.message}
                            </li>
                        ))}
                    </ul>
                )}
                {traceId && <span className="text-[10px] opacity-70">Trace ID: {traceId}</span>}
            </div>
        ),
    })
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60,
        },
        mutations: {},
    },
    queryCache: new QueryCache({
        // Queries can opt out of the global error toast via meta.skipGlobalError.
        onError: (error, query) => {
            if (query.meta?.skipGlobalError) return
            if ((error as any)?.response?.status === 403 && !query.meta?.skipForbiddenScreen) {
                const { message, traceId } = getErrorMessage(error, i18n.t('common.error'))
                const resolved = i18n.exists(message) ? i18n.t(message) : message
                useForbiddenStore.getState().trigger({ message: resolved, traceId })
                return
            }
            handleGlobalError(error)
        },
    }),
    mutationCache: new MutationCache({
        onSuccess: async (_data, _variables, _context, mutation) => {
            await queryClient.invalidateQueries({
                predicate: query =>
                    (mutation.meta?.invalidates as any)?.some((queryKey: any) => matchQuery({ queryKey }, query)) ??
                    false,
            })
        },
        onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.skipGlobalError) return
            handleGlobalError(error)
        },
    }),
})

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <BsProvider>
            <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <MenuDataProvider>{children}</MenuDataProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </BsProvider>
    )
}
