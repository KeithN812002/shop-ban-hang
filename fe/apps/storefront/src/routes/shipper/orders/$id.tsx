import { createFileRoute } from '@tanstack/react-router'
import { ShipperOrderDetailPage } from '@/features/shipper/pages/order-detail-page'

export const Route = createFileRoute('/shipper/orders/$id')({ component: ShipperOrderRoute })

function ShipperOrderRoute() {
    const { id } = Route.useParams()
    return <ShipperOrderDetailPage orderId={id} />
}
