import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/shipper/pages/profile-page'

export const Route = createFileRoute('/shipper/profile')({ component: ProfilePage })
