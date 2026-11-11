import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { Toaster } from '@workspace/ui/components/Sonner'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ChatbotWidget } from '@/features/chatbot/chatbot-widget'

export const Route = createRootRoute({ component: RootLayout })

function RootLayout() {
    // The shipper area is a mobile app with its own bottom tab bar; footer and chatbot would sit under it.
    const isShipperArea = useRouterState({ select: s => s.location.pathname.startsWith('/shipper') })
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            {!isShipperArea && <Footer />}
            {!isShipperArea && <ChatbotWidget />}
            <Toaster position="top-center" />
        </div>
    )
}
