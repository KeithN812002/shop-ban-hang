import { createFileRoute } from '@tanstack/react-router'
import { ProductFormPage } from '@/features/seller/pages/product-form-page'

export const Route = createFileRoute('/seller/products/new')({ component: () => <ProductFormPage /> })
