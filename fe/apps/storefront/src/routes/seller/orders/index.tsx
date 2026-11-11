import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { validateOrdersSearch } from '@/features/seller/lib/orders-search'
import { OrdersPage } from '@/features/seller/pages/orders-page'

export const Route = createFileRoute('/seller/orders/')({
    validateSearch: validateOrdersSearch,
    component: OrdersRoute,
})

function OrdersRoute() {
    const search = Route.useSearch()
    const navigate = useNavigate({ from: Route.fullPath })
    return <OrdersPage search={search} onSearchChange={next => void navigate({ search: next, replace: true })} />
}
