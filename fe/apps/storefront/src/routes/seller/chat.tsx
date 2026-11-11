import { createFileRoute } from '@tanstack/react-router'
import { ChatPage } from '@/features/seller/pages/chat-page'

export const Route = createFileRoute('/seller/chat')({ component: ChatPage })
