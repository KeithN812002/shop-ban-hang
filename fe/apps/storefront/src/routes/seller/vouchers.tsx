import { createFileRoute } from '@tanstack/react-router'
import { VouchersPage } from '@/features/seller/pages/vouchers-page'

export const Route = createFileRoute('/seller/vouchers')({ component: VouchersPage })
