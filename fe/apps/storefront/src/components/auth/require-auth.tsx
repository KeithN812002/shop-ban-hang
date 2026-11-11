import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { PageSpinner } from '@/components/ui/feedback'
import { useAuth } from '@/providers/auth-provider'

/**
 * Sends anonymous visitors to Keycloak, returning them to the current page afterwards.
 * The redirect fires once: a <Navigate> here re-fired on every re-render of the guarded layout while the router
 * was still transitioning, nesting `?redirect=` into itself until the tab ran out of memory.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const { isAuthenticated, login } = useAuth()
    const location = useLocation()
    const started = useRef(false)

    useEffect(() => {
        if (isAuthenticated || started.current) return
        started.current = true
        login(location.href)
    }, [isAuthenticated, login, location.href])

    if (!isAuthenticated) return <PageSpinner />
    return <>{children}</>
}

/** Hook flavour for click handlers (add to cart, wishlist, follow ...): returns true when logged in. */
export function useRequireLogin(): () => boolean {
    const { isAuthenticated, login } = useAuth()
    const location = useLocation()
    return () => {
        if (isAuthenticated) return true
        login(location.href)
        return false
    }
}
