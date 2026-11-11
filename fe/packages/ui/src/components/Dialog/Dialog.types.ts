import type { DialogProps as AriaDialogProps } from 'react-aria-components'
import type { Modal as AriaModal } from 'react-aria-components'
import type React from 'react'

export interface DialogContentProps extends Omit<React.ComponentProps<typeof AriaModal>, 'children'> {
    children?: AriaDialogProps['children']
    role?: AriaDialogProps['role']
    closeButton?: boolean
    isFullscreenOnMobile?: boolean
    /** Controlled open state */
    isOpen?: boolean
    /** Callback when open state changes */
    onOpenChange?: (isOpen: boolean) => void
    /** Whether the dialog can be dismissed by clicking outside */
    isDismissable?: boolean
}
