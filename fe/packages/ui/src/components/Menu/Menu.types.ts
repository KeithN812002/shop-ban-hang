import type { Header as AriaHeader } from 'react-aria-components'

export interface MenuHeaderProps extends React.ComponentProps<typeof AriaHeader> {
    inset?: boolean
    separator?: boolean
}
