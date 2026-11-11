import { useEffect } from 'react'
import { Outlet, useLocation, useRouter } from '@tanstack/react-router'
import { ErrorState, PageSpinner } from '@/components/ui/feedback'
import { RequireAuth } from '@/components/auth/require-auth'
import { useProfile } from '@/hooks/use-profile'

export type PartnerRole = 'seller' | 'shipper'

/**
 * Guard for /seller/* and /shipper/*:
 *  - anonymous            -> login
 *  - not ACTIVE           -> /<role>/register (form, or PENDING / REJECTED / SUSPENDED status)
 *  - ACTIVE               -> children via <Outlet/> (register page redirects to the dashboard)
 */
export function RoleGate({ role }: { role: PartnerRole }) {
    return (
        <RequireAuth>
            <RoleGateInner role={role} />
        </RequireAuth>
    )
}

function RoleGateInner({ role }: { role: PartnerRole }) {
    const router = useRouter()
    const { pathname } = useLocation()
    const { isLoading, isError, isSeller, isShipper, refetch, profile } = useProfile()

    const isActive = role === 'seller' ? isSeller : isShipper
    const home = `/${role}`
    const registerPath = `${home}/register`
    const onRegister = pathname === registerPath || pathname === `${registerPath}/`
    // While the router leaves this area (e.g. "Về trang chủ") the gate is still mounted with the new pathname;
    // redirecting then would pull the user straight back to the register page.
    const inArea = pathname === home || pathname.startsWith(`${home}/`)
    const ready = Boolean(profile)

    const redirectTo =
        !ready || !inArea ? null : isActive ? (onRegister ? home : null) : onRegister ? null : registerPath

    useEffect(() => {
        if (redirectTo) router.history.replace(redirectTo)
    }, [redirectTo, router])

    if (isLoading || (ready && redirectTo)) return <PageSpinner />
    if (isError || !ready) return <ErrorState onRetry={refetch} className="container-page" />
    return <Outlet />
}
