import { createFileRoute } from '@tanstack/react-router'
import { OrderDetailPage } from '@/features/seller/pages/order-detail-page'

export const Route = createFileRoute('/seller/orders/$id')({ component: OrderDetailRoute })

function OrderDetailRoute() {
    const { id } = Route.useParams()
    return <OrderDetailPage orderId={id} />
}
