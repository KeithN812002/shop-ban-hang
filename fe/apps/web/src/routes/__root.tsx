import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { ShieldAlert, RotateCcw } from 'lucide-react'
import { Providers } from '@/shared/components/Providers'
import i18n from '@/i18n/config'

export const Route = createRootRoute({
    component: RootComponent,
    // App-crash fallback. Rendered outside Providers, so use the global i18n instance.
    errorComponent: ({ error }) => {
        if (import.meta.env.DEV) {
            console.error('App crashed:', error)
        }
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-lg rounded-2xl border-2 border-slate-400/40 bg-white/80 p-8 shadow-lg backdrop-blur-sm">
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <ShieldAlert className="h-8 w-8 text-red-500" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800">{i18n.t('common.appError.title')}</h1>
                            <p className="mt-2 text-base text-pretty text-slate-600">
                                {i18n.t('common.appError.description')}
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="xl"
                            className="w-full"
                            onClick={() => window.location.reload()}
                        >
                            <RotateCcw />
                            {i18n.t('common.appError.reload')}
                        </Button>
                    </div>
                </div>
            </div>
        )
    },
    notFoundComponent: () => {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
                    <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
                    <a href="/" className="text-primary hover:underline">
                        Go back home
                    </a>
                </div>
            </div>
        )
    },
})

function RootComponent() {
    return (
        <Providers>
            <Outlet />
        </Providers>
    )
}
