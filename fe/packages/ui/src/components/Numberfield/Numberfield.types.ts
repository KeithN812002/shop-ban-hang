import { type Control, type RegisterOptions } from 'react-hook-form'

export interface BsNumberFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
    rules?: RegisterOptions
    showStepper?: boolean
    containerClassName?: string
    minValue?: number
    maxValue?: number
    step?: number
    isDisabled?: boolean
    formatOptions?: any
}
