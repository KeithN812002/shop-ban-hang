'use client'

import * as LucideIcons from 'lucide-react'
import type { ComponentType } from 'react'

export const getIconComponent = (iconName: string) => {
    if (!iconName) return null
    const Icon = (LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>)[iconName]
    return Icon ? <Icon className="size-4" /> : null
}

export const renderIconOption = (option: { id: string; name: string; icon: string }) => {
    const icon = getIconComponent(option.icon)
    return (
        <div className="flex items-center gap-2">
            {icon || <span className="size-4" />}
            <span>{option.name}</span>
        </div>
    )
}

export const renderSelectedIcon = (option: { id: string; name: string; icon: string }) => {
    const icon = getIconComponent(option.icon)
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span>{option.name}</span>
        </div>
    )
}
