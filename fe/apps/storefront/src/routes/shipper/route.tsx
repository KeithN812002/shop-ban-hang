import { createFileRoute } from '@tanstack/react-router'
import { RoleGate } from '@/components/auth/role-gate'

// Guard layout for the shipper area. Pages under /shipper/* render inside the <Outlet/> of RoleGate
// and are only reachable for an ACTIVE shipper.
export const Route = createFileRoute('/shipper')({
    component: () => <RoleGate role="shipper" />,
})
