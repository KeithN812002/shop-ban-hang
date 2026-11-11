export type IconComponent = React.ComponentType<{ className?: string }>

export interface TreeItemLayoutProps {
    icon?: React.ReactNode
    iconComponent?: IconComponent
    iconClassName?: string
    title: React.ReactNode
    description?: React.ReactNode
    meta?: React.ReactNode
    badge?: React.ReactNode
    trailing?: React.ReactNode
    className?: string
    children?: React.ReactNode
}
