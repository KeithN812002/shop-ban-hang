import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/features/seller/pages/dashboard-page'

export const Route = createFileRoute('/seller/')({ component: DashboardPage })
