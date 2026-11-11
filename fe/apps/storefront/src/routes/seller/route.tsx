import { createFileRoute } from '@tanstack/react-router'
import { RoleGate } from '@/components/auth/role-gate'

// Guard layout for the Seller Center. Pages under /seller/* render inside the <Outlet/> of RoleGate
// and are only reachable for an ACTIVE store owner.
export const Route = createFileRoute('/seller')({
    component: () => <RoleGate role="seller" />,
})
