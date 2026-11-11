export type FieldHighlightVariant = 'success' | 'warning' | 'danger'

export const getFieldHighlightLabelClass = (variant?: FieldHighlightVariant): string => {
    switch (variant) {
        case 'success':
            return 'text-emerald-600!'
        case 'warning':
            return 'text-amber-600!'
        case 'danger':
            return 'text-red-600!'
        default:
            return ''
    }
}

export const getFieldHighlightControlClass = (variant?: FieldHighlightVariant): string => {
    switch (variant) {
        case 'success':
            return 'ring-2! ring-emerald-500/60! bg-emerald-50/80!'
        case 'warning':
            return 'ring-2! ring-amber-500/60! bg-amber-50/80!'
        case 'danger':
            return 'ring-2! ring-red-500/60! bg-red-50/80! opacity-80'
        default:
            return ''
    }
}

export const getFieldHighlightMessageClass = (variant?: FieldHighlightVariant): string => {
    switch (variant) {
        case 'success':
            return 'text-emerald-600'
        case 'warning':
            return 'text-amber-600'
        case 'danger':
            return 'text-red-600'
        default:
            return ''
    }
}

export const getFieldHighlightCheckboxWrapperClass = (variant?: FieldHighlightVariant): string => {
    switch (variant) {
        case 'success':
            return 'rounded-sm px-2 ring-2 ring-inset ring-emerald-500/60 bg-emerald-50/80 text-emerald-700'
        case 'warning':
            return 'rounded-sm px-2 ring-2 ring-inset ring-amber-500/60 bg-amber-50/80 text-amber-700'
        case 'danger':
            return 'rounded-sm px-2 ring-2 ring-inset ring-red-500/60 bg-red-50/80 text-red-700 opacity-80'
        default:
            return ''
    }
}
