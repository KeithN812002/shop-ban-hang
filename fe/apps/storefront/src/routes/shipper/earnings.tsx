import { createFileRoute } from '@tanstack/react-router'
import { EarningsPage } from '@/features/shipper/pages/earnings-page'

export const Route = createFileRoute('/shipper/earnings')({ component: EarningsPage })
