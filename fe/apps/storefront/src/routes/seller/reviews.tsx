import { createFileRoute } from '@tanstack/react-router'
import { ReviewsPage } from '@/features/seller/pages/reviews-page'

export const Route = createFileRoute('/seller/reviews')({ component: ReviewsPage })
