import type { ElementType } from 'react'
import type { ParseKeys } from 'i18next'
import { Button, type ButtonProps } from '@workspace/ui/components/Button'
import { usePermissionAction } from '@/hooks/usePermissionAction'
import {
    ArrowLeft,
    Ban,
    Check,
    CheckCircle,
    CircleSlash,
    RotateCw,
    FileSpreadsheet,
    FileText,
    Plus,
    RefreshCcw,
    Save,
    Search,
    Send,
    Trash2,
    Undo2,
    Upload,
    X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@workspace/ui/lib/utils'

interface ActionPreset {
    icon: ElementType
    labelKey?: ParseKeys
    variant?: ButtonProps['variant']
}

export const ACTION_PRESETS = {
    addNew: { icon: Plus, labelKey: 'common.addNew' },
    create: { icon: Save, labelKey: 'common.save' },
    update: { icon: Save, labelKey: 'common.save' },
    save: { icon: Save, labelKey: 'common.save' },
    saveData: { icon: Save, labelKey: 'common.saveData' },
    saveDraft: { icon: FileText, labelKey: 'common.saveDraft' },
    delete: { icon: Trash2, labelKey: 'common.delete' },
    cancel: { icon: X, labelKey: 'common.cancel' },
    close: { icon: X, labelKey: 'common.close' },
    back: { icon: ArrowLeft, labelKey: 'common.back' },
    search: { icon: Search, labelKey: 'common.search' },
    sync: { icon: RefreshCcw, labelKey: 'common.sync' },
    upload: { icon: Upload, labelKey: 'common.upload' },
    export: { icon: FileSpreadsheet },
    send: { icon: Send, labelKey: 'common.send' },
    confirm: { icon: Check, labelKey: 'common.confirm' },
    complete: { icon: Check },
    approve: { icon: Check },
    return: { icon: Undo2, variant: 'warning' },
    reject: { icon: Ban, variant: 'destructive' },
    unApprove: { icon: CircleSlash, variant: 'info' },
    verify: { icon: CheckCircle },
    resendBulk: { icon: RotateCw, labelKey: 'emailOutbox.actions.resendBulk', variant: 'warning' },
} satisfies Record<string, ActionPreset>

export type ActionType = keyof typeof ACTION_PRESETS

const PERMISSION_FREE_ACTIONS = new Set<ActionType>(['cancel', 'close', 'back'])

interface ActionButtonProps extends ButtonProps {
    actionCode?: string
    menuCode?: string
    permissionBehavior?: 'hide' | 'disable'
    actionType?: ActionType
    icon?: ElementType
    label?: string
}

export function ActionButton({
    actionCode,
    menuCode,
    permissionBehavior = 'hide',
    actionType,
    icon,
    label,
    children,
    variant,
    className,
    ...props
}: ActionButtonProps) {
    const { t } = useTranslation()
    const { checkPermission } = usePermissionAction(menuCode)

    const preset: ActionPreset | undefined = actionType ? ACTION_PRESETS[actionType] : undefined

    const isAllowed =
        !actionCode || (actionType && PERMISSION_FREE_ACTIONS.has(actionType)) ? true : checkPermission(actionCode)

    if (!isAllowed && permissionBehavior === 'hide') return null

    const IconComponent = icon ?? preset?.icon
    const content = typeof children === 'function' ? undefined : children
    const text = label ?? content ?? (preset?.labelKey ? t(preset.labelKey) : undefined)

    return (
        <Button
            {...props}
            className={cn('w-fit', className)}
            variant={variant ?? preset?.variant}
            isDisabled={!isAllowed || props.isDisabled}
        >
            {IconComponent && <IconComponent className="size-4" />}
            {text}
        </Button>
    )
}
