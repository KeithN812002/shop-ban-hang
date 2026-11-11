'use client'

import { Switch as AriaSwitch, SwitchProps as AriaSwitchProps, composeRenderProps } from 'react-aria-components'
import { Controller, useFormContext, type Control } from 'react-hook-form'

import { cn } from '@workspace/ui/lib/utils'
import { Label } from '@workspace/ui/components/Field'

const Switch = ({ children, className, ...props }: AriaSwitchProps) => (
    <AriaSwitch
        className={composeRenderProps(className, className =>
            cn(
                'group relative inline-flex items-center gap-2 text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70',
                className,
            ),
        )}
        {...props}
    >
        {composeRenderProps(children, children => (
            <>
                <div className="h-8 flex items-center">
                    <div
                        className={cn(
                            'peer inline-flex h-[22px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border-3 border-transparent transition-colors',
                            /* Focus Visible */
                            'group-data-[focus-visible]:outline-none group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-primary/40 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-background',
                            /* Disabled */
                            'group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50',
                            /* Selected */
                            'bg-input group-data-[selected]:bg-primary',
                            /* Readonly */
                            'group-data-[readonly]:cursor-default',
                            /* Resets */
                            'focus-visible:outline-none',
                        )}
                    >
                        <div
                            className={cn(
                                'pointer-events-none block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
                                /* Selected */
                                'translate-x-0 group-data-[selected]:translate-x-[30px]',
                            )}
                        />
                    </div>
                </div>
                {children}
            </>
        ))}
    </AriaSwitch>
)

/* ──────────────────────────────────────────────
 * Form-integrated wrapper
 * ────────────────────────────────────────────── */

interface BsSwitchProps extends Omit<AriaSwitchProps, 'children'> {
    label?: string
    isRequired?: boolean
    errorMessage?: string
    name?: string
    control?: Control<any>
    children?: AriaSwitchProps['children']
}

function BsSwitch({ label, isRequired, errorMessage, name: fieldName, control, ...switchProps }: BsSwitchProps) {
    const formContext = useFormContext()
    const resolvedControl = control ?? formContext?.control

    const labelNode = label ? (
        <Label className="text-[13px] text-foreground/80">
            {label} {isRequired && <span className="text-destructive">*</span>}
        </Label>
    ) : null

    if (fieldName && resolvedControl) {
        return (
            <Controller
                name={fieldName}
                control={resolvedControl}
                render={({ field, fieldState }) => {
                    const errMsg = fieldState.error?.message || errorMessage
                    return (
                        <div className="flex flex-col">
                            {labelNode}
                            <Switch {...switchProps} isSelected={field.value} onChange={field.onChange} />
                            {errMsg && <p className="text-xs text-destructive mt-1">{errMsg}</p>}
                        </div>
                    )
                }}
            />
        )
    }

    if (label || errorMessage) {
        return (
            <div className="flex flex-col">
                {labelNode}
                <Switch {...switchProps} />
                {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            </div>
        )
    }

    return <Switch {...switchProps} />
}

export { Switch, BsSwitch }
