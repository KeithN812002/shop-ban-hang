import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MyOrdersPage } from '@/features/shipper/pages/my-orders-page'
import { MY_ORDER_STATUSES, type MyOrderStatus } from '@/features/shipper/types'

interface MyOrdersSearch {
    status?: MyOrderStatus
}

const STATUSES: readonly string[] = MY_ORDER_STATUSES

export const Route = createFileRoute('/shipper/orders/')({
    validateSearch: (raw: Record<string, unknown>): MyOrdersSearch => ({
        status:
            typeof raw.status === 'string' && STATUSES.includes(raw.status) ? (raw.status as MyOrderStatus) : undefined,
    }),
    component: MyOrdersRoute,
})

function MyOrdersRoute() {
    const { status = 'PICKING' } = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })
    return (
        <MyOrdersPage
            status={status}
            onStatusChange={next => void navigate({ search: { status: next }, replace: true })}
        />
    )
}
