import type { DialogProps as AriaDialogProps, Modal as AriaModal } from 'react-aria-components'

export interface SheetContentProps extends Omit<React.ComponentProps<typeof AriaModal>, 'children'> {
    children?: AriaDialogProps['children']
    role?: AriaDialogProps['role']
    closeButton?: boolean
    side?: 'top' | 'right' | 'bottom' | 'left'
}
