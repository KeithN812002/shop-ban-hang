import { MutationCache, QueryClient } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { ApiError, getErrorMessage } from '@/lib/http'
import { notify } from '@/lib/notify'

declare module '@tanstack/react-query' {
    interface Register {
        mutationMeta: { silent?: boolean }
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                // Client errors (4xx) will not heal on retry.
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
                return failureCount < 2
            },
        },
    },
    // Every failed mutation shows the server message once, unless the call site opts out via meta.silent.
    mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return
            notify.error(getErrorMessage(error, i18n.t('common.genericError')))
        },
    }),
})
