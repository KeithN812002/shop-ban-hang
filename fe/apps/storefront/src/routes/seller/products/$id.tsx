import { createFileRoute } from '@tanstack/react-router'
import { ProductFormPage } from '@/features/seller/pages/product-form-page'

export const Route = createFileRoute('/seller/products/$id')({ component: EditProductRoute })

function EditProductRoute() {
    const { id } = Route.useParams()
    return <ProductFormPage productId={id} />
}
