import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/features/seller/pages/settings-page'

export const Route = createFileRoute('/seller/settings')({ component: SettingsPage })
