import { icons } from 'lucide-react'

export const ICON_OPTIONS: { id: string; name: string; icon: string }[] = Object.keys(icons)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({ id: name, name, icon: name }))
