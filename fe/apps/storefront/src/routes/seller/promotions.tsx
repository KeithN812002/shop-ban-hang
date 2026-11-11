import { createFileRoute } from '@tanstack/react-router'
import { PromotionsPage } from '@/features/seller/pages/promotions-page'

export const Route = createFileRoute('/seller/promotions')({ component: PromotionsPage })
