export interface Action {
    label: React.ReactNode
    onClick: () => void | Promise<void>
    icon?: React.ReactNode
}

export interface ConfirmDialogContext {
    /** Indicates whether the confirm dialog is open */
    isOpen: boolean
    /** Data for the confirm dialog, including title, description, and actions */
    data?: {
        /** The title displayed in the confirm dialog */
        title: string
        /** Optional description displayed in the confirm dialog */
        description?: string
        /** Optional action button configuration */
        action?: Action
        /** Optional cancel button configuration */
        cancel?: Action
        /** Optional variant for the action button */
        variant?: 'default' | 'destructive' | 'warning'
    }
}
