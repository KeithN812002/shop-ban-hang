import { createFileRoute } from '@tanstack/react-router'
import { ProductsPage } from '@/features/seller/pages/products-page'

export const Route = createFileRoute('/seller/products/')({ component: ProductsPage })
