import { createFileRoute } from '@tanstack/react-router'
import { AvailablePage } from '@/features/shipper/pages/available-page'

export const Route = createFileRoute('/shipper/')({ component: AvailablePage })
